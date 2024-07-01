import type { MetaFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { JSDOM } from 'jsdom';

export const meta: MetaFunction = () => {
  return [
    { title: 'Compare UI' },
    { name: 'description', content: 'Compare UI Component Libs' },
  ];
};

const scrapeComponentLinks = async ({
  url,
  base,
  selector,
}: {
  url: string;
  selector: string;
  base: string;
}) => {
  const jsdom = new JSDOM(await fetch(url).then((r) => r.text()));

  const components = Array.from(
    jsdom.window.document.querySelectorAll(selector)
  ).map((c) => {
    const link = c as HTMLLinkElement;
    return {
      name: link.textContent!.replaceAll(/\.css.*}/g, ''),
      url: `${base}${link.href}`,
    };
  });

  return components;
};

export const loader = async () => {
  const [shadcnComponents, arkUiComponents, zagJsComponents] =
    await Promise.all([
      scrapeComponentLinks({
        url: 'https://ui.shadcn.com/docs',
        base: 'https://ui.shadcn.com',
        selector:
          'body > div:nth-child(2) > div > main > div > div > aside > div > div > div > div > div:nth-child(2) > div > a',
      }),
      scrapeComponentLinks({
        url: 'https://ark-ui.com/react/docs/overview/introduction',
        base: 'https://ark-ui.com',
        selector:
          'aside > nav > ul > li:nth-child(3) > div > div > ul > li > a',
      }),
      scrapeComponentLinks({
        url: 'https://zagjs.com/overview/introduction',
        base: 'https://zagjs.com',
        selector: 'nav > ul > li:nth-child(2) > ul > li > a',
      }),
    ]);

  return {
    shadcnComponents,
    arkUiComponents,
    zagJsComponents,
  };
};

export default function Index() {
  const { shadcnComponents, arkUiComponents, zagJsComponents } =
    useLoaderData<typeof loader>();

  return (
    <div className="font-sans p-4 flex flex-col gap-5">
      <h1 className="text-5xl">Compare UI</h1>

      <div className="flex gap-5">
        <section>
          <h3 className="text-3xl">Shadcn {shadcnComponents.length}</h3>
          <ul className="flex flex-col gap-2">
            {shadcnComponents.map((component) => (
              <a
                key={component.url}
                href={component.url}
                target="_blank"
                rel="noreferrer"
              >
                {component.name}
              </a>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-3xl">Ark UI {arkUiComponents.length}</h3>
          <ul className="flex flex-col gap-2">
            {arkUiComponents.map((component) => (
              <a
                key={component.url}
                href={component.url}
                target="_blank"
                rel="noreferrer"
              >
                {component.name}
              </a>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-3xl">Zag Js {zagJsComponents.length}</h3>
          <ul className="flex flex-col gap-2">
            {zagJsComponents.map((component) => (
              <a
                key={component.url}
                href={component.url}
                target="_blank"
                rel="noreferrer"
              >
                {component.name}
              </a>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
