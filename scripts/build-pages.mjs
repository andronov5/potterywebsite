import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Build a read-only Pages catalog without changing the full Next.js application.
// Keep staging outside the checkout so TypeScript cannot include its route types.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const stage = await mkdtemp(join(tmpdir(), 'pottery-pages-'));
const destination = join(root, 'pages-dist');
const basePath = '/potterywebsite';

async function replace(file, from, to) {
  const path = join(stage, file);
  const text = await readFile(path, 'utf8');
  if (!text.includes(from)) throw new Error(`Pages build: update the transformation for ${file}`);
  await writeFile(path, text.replace(from, to));
}

try {
  // Explicit allowlist: never copy environment files, credentials, or build output.
  for (const file of ['app', 'public', 'package.json', 'tsconfig.json']) {
    await cp(join(root, file), join(stage, file), { recursive: true });
  }
  await symlink(join(root, 'node_modules'), join(stage, 'node_modules'), 'dir');
  await rm(join(stage, 'app/api'), { recursive: true, force: true });
  await rm(join(stage, 'app/checkout'), { recursive: true, force: true });
  await writeFile(join(stage, 'next.config.mjs'), `export default ${JSON.stringify({
    output: 'export', basePath, trailingSlash: true, images: { unoptimized: true },
  })};\n`);

  await writeFile(join(stage, 'app/lib/catalog.ts'), `
import 'server-only';
import { initialProducts, type Product } from '../products';
const products: Product[] = initialProducts.filter(p => p.published).map(p => ({
  ...p, images: p.images.map(image => ({ ...image, src: ${JSON.stringify(basePath)} + image.src })),
}));
export async function getProducts() { return products; }
export async function getProduct(slug: string) { return products.find(p => p.slug === slug); }
export async function getStudio() {
  return { contact_email: '', portrait_url: '${basePath}/studio/natalie-portrait.jpg' };
}
`);
  for (const file of ['app/page.tsx', 'app/about/page.tsx', 'app/product/[slug]/page.tsx']) {
    await replace(file, "export const dynamic = 'force-dynamic';", '');
  }
  await replace('app/page.tsx', "import { checkoutReady } from './lib/server';", '');
  await replace('app/page.tsx', 'const orderingEnabled = checkoutReady();', 'const orderingEnabled = false;');
  await replace('app/product/[slug]/page.tsx', "import { checkoutReady } from '../../lib/server';", '');
  await replace('app/product/[slug]/page.tsx', "import { hasDatabase } from '../../lib/supabase';", `
import { getProducts } from '../../lib/catalog';
export const dynamicParams = false;
export async function generateStaticParams() {
  return (await getProducts()).map(product => ({ slug: product.slug }));
}
`);
  await replace('app/product/[slug]/page.tsx', 'enabled={checkoutReady()}', 'enabled={false}');
  await replace('app/product/[slug]/page.tsx', 'enabled={hasDatabase()}', 'enabled={false}');
  await replace('app/about/page.tsx',
    'AboutPage({ searchParams }: { searchParams: Promise<{ piece?: string }> })', 'AboutPage()');
  await replace('app/about/page.tsx', 'const { piece } = await searchParams;', "const piece = ''; ");
  await replace('app/about/page.tsx',
    'enabled={Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL)}', 'enabled={false}');
  await replace('app/lib/brand.ts', "'/brand/pottery-by-natalie-logo.jpg'", `'${basePath}/brand/pottery-by-natalie-logo.jpg'`);

  // Pages has no server. Do not include a login form or imply that credentials work here.
  await rm(join(stage, 'app/admin'), { recursive: true });
  await mkdir(join(stage, 'app/admin'));
  await writeFile(join(stage, 'app/admin/page.tsx'), `
import Link from 'next/link';
export const metadata = { title: 'Studio', robots: { index: false, follow: false } };
export default function AdminPage() {
  return <main id="main-content" className="admin-page"><section className="login-card">
    <p className="eyebrow">Natalie’s studio</p><h1>Studio login</h1>
    <p>This collection preview is open for browsing. Studio access and online ordering are coming with the full shop.</p>
    <Link href="/" className="paper-button">View the collection</Link>
  </section></main>;
}
`);
  const env = { ...process.env, NEXT_TELEMETRY_DISABLED: '1' };
  for (const key of Object.keys(env)) {
    if (/SUPABASE|STRIPE|CHECKOUT|SITE_URL/.test(key)) delete env[key];
  }
  const build = spawnSync(process.execPath, [join(root, 'node_modules/next/dist/bin/next'), 'build', '--webpack'], {
    cwd: stage, env, stdio: 'inherit',
  });
  if (build.status !== 0) throw new Error(`Static build failed (${build.status ?? build.error})`);
  await rm(destination, { recursive: true, force: true });
  await cp(join(stage, 'out'), destination, { recursive: true });
  await writeFile(join(destination, '.nojekyll'), '');
  console.log(`Pages catalog built at ${destination}`);
} finally {
  await rm(stage, { recursive: true, force: true });
}
