import { Effect } from 'effect';
import {
  capitalizeSubsequentWords,
  scrapeComponentLinks,
  scrapeComponentLinksSeekOss,
  scrapeGithubDirectoryFileLinks,
  scrapeGithubDirectoryFolderLinks,
  splitCamelcase,
} from './scrapingHelpers';

const shadCn = scrapeComponentLinks({
  url: 'https://ui.shadcn.com/docs',
  base: 'https://ui.shadcn.com',
  linkSelector:
    'body > div:nth-child(2) > div > main > div > div > aside > div > div > div > div > div:nth-child(2) > div > a',
}).pipe(
  Effect.map((data) => ({
    ...data,
    name: 'Shadcn',
    site: 'https://ui.shadcn.com',
  }))
);

const arkUi = scrapeComponentLinks({
  url: 'https://ark-ui.com/react/docs/overview/introduction',
  base: 'https://ark-ui.com',
  linkSelector: 'aside > nav > ul > li:nth-child(3) > div > div > ul > li > a',
}).pipe(
  Effect.map((data) => ({
    ...data,
    name: 'ArkUI',
    site: 'https://ark-ui.com',
  }))
);

const zagJs = scrapeComponentLinks({
  url: 'https://zagjs.com/overview/introduction',
  base: 'https://zagjs.com',
  linkSelector: 'nav > ul > li:nth-child(2) > ul > li > a',
}).pipe(
  Effect.map((data) => ({
    ...data,
    name: 'ZagJS',
    site: 'https://zagjs.com',
  }))
);

const nextUi = scrapeComponentLinks({
  url: 'https://nextui.org/docs/guide/introduction',
  base: 'https://nextui.org',
  linkSelector:
    '#app-container > main > div > div.hidden.overflow-visible.relative.z-10.lg\\:block.lg\\:col-span-2.mt-8.pr-4 > div > div > div > div > ul:nth-child(4) > div.flex.flex-col.gap-3.items-start > li > div > a',
}).pipe(
  Effect.map((data) => ({
    ...data,
    name: 'Next UI',
    site: 'https://nextui.org',
  }))
);

const baseUi = scrapeComponentLinks({
  url: 'https://mui.com/base-ui/all-components/',
  base: 'https://mui.com',
  linkSelector:
    '#__next > div > nav > div > div > div.MuiBox-root > div > ul > li:nth-child(2) > div > div > div > ul > li > ul > li > a',
}).pipe(
  Effect.map((data) => ({
    ...data,
    name: 'Base UI',
    site: 'https://mui.com/base-ui',
  }))
);

const arekUi = scrapeGithubDirectoryFileLinks({
  url: 'https://github.com/arekmaz/arek-ui/tree/main/app/components/ui',
  base: 'https://arek-ui.fly.dev/?q=',
  linkSelector:
    'table > tbody > tr > td.react-directory-row-name-cell-large-screen > div > div > div > div > a',
}).pipe(
  Effect.map(({ components, ...rest }) => ({
    ...rest,
    components: components.map(({ name, ...c }) => ({
      ...c,
      name: splitCamelcase(name),
    })),
  })),
  Effect.map((data) => ({
    ...data,
    name: 'Arek UI',
    site: 'https://arek-ui.fly.dev/',
  }))
);

const headlessUi = scrapeComponentLinks({
  url: 'https://headlessui.com/',
  base: 'https://headlessui.com/react/',
  linkSelector:
    '#__next > div > div > main > div > div > div > a > div:nth-child(2)',
}).pipe(
  Effect.map((data) => ({
    ...data,
    name: 'Headless UI',
    site: 'https://headlessui.com',
  }))
);

const daisyUi = scrapeComponentLinks({
  url: 'https://daisyui.com/components/',
  base: 'https://daisyui.com/components/',
  linkSelector: '.card-title',
}).pipe(
  Effect.map((data) => ({
    ...data,
    name: 'Daisy UI',
    site: 'https://daisyui.com',
  }))
);

const materialUi = scrapeComponentLinks({
  url: 'https://mui.com/material-ui/all-components/',
  base: 'https://mui.com',
  linkSelector:
    '#__next > div > nav > div > div > div.MuiBox-root > div > ul > li:nth-child(2) > div > div > div > ul > li > ul > li > a',
}).pipe(
  Effect.map(({ components, ...rest }) => ({
    ...rest,
    name: 'Material UI',
    site: 'https://mui.com',
    components: components.filter(
      (component) =>
        ![/about-the-lab/, /react-use-media-query/].some((re) =>
          re.test(component.url)
        )
    ),
  }))
);

const reactAria = scrapeComponentLinks({
  url: 'https://react-spectrum.adobe.com/react-aria/components.html',
  base: 'https://react-spectrum.adobe.com/',
  linkSelector: 'nav > details:nth-child(8) > ul > li > a',
}).pipe(
  Effect.map(({ components, ...rest }) => ({
    ...rest,
    components: components.map(({ name, ...c }) => ({
      ...c,
      name: splitCamelcase(name),
    })),
  })),
  Effect.map((data) => ({
    ...data,
    name: 'React Aria',
    site: 'https://react-spectrum.adobe.com/react-aria',
  }))
);

const parkUi = scrapeComponentLinks({
  url: 'https://park-ui.com/docs/panda/components/accordion',
  base: 'https://park-ui.com',
  linkSelector:
    '#sidebar > astro-island:nth-child(1)> aside:nth-child(1) > nav:nth-child(1) > ul.d_flex > li:nth-child(4) > #collapsible\\:\\:r24R4\\: > #collapsible\\:\\:r24R4\\:\\:content > ul:nth-child(1) > li > a',
}).pipe(
  Effect.map((data) => ({
    ...data,
    name: 'Park UI',
    site: 'https://park-ui.com',
  }))
);

const reactBootstrap = scrapeComponentLinks({
  url: 'https://react-bootstrap.github.io/docs/components/accordion',
  base: 'https://react-bootstrap.github.io',
  linkSelector:
    '#__docusaurus_skipToContent_fallback > div > div > aside > div > div > nav > ul > li:nth-child(4) > ul > li > a',
}).pipe(
  Effect.map((data) => ({
    ...data,
    name: 'React Boostrap',
    site: 'https://react-bootstrap.github.io',
    components: data.components.map(({ name, ...cmp }) => ({
      ...cmp,
      name: capitalizeSubsequentWords(name.replace(/s$/, '')),
    })),
  }))
);

const antDesign = scrapeGithubDirectoryFolderLinks({
  url: 'https://github.com/ant-design/ant-design/tree/master/components',
  base: 'https://ant.design/',
  linkSelector:
    'table > tbody > tr > td.react-directory-row-name-cell-large-screen > div > div > div > div > a',
}).pipe(
  Effect.map(({ components, ...rest }) => ({
    ...rest,
    components: components
      .filter(({ name }) => !name.startsWith('_'))
      .map(({ name, ...c }) => ({
        ...c,
        name: splitCamelcase(name),
      })),
  })),
  Effect.map((data) => ({
    ...data,
    name: 'Ant Design',
    site: 'https://ant.design/',
  }))
);

const semanticUi = scrapeComponentLinks({
  url: 'https://semantic-ui.com/elements/button.html',
  base: 'https://semantic-ui.com',
  linkSelector:
    'div.toc > div:nth-child(1) > div:nth-child(n+7):nth-child(-n+10) > div:nth-child(2) > a',
}).pipe(
  Effect.map((data) => ({
    ...data,
    name: 'Semantic UI',
    site: 'https://semantic-ui.com',
  }))
);

const blueprintJs = scrapeGithubDirectoryFolderLinks({
  url: 'https://github.com/palantir/blueprint/tree/develop/packages/core/src/components',
  base: 'https://blueprintjs.com/docs/#core/components/',
  linkSelector:
    'table > tbody > tr > td.react-directory-row-name-cell-large-screen > div > div > div > div > a',
}).pipe(
  Effect.map(({ components, ...rest }) => ({
    ...rest,
    components: components.map(({ name, url, ...c }) => ({
      ...c,
      name: splitCamelcase(name),
      url: url.toLowerCase(),
    })),
  })),
  Effect.map((data) => ({
    ...data,
    name: 'Blueprint JS',
    site: 'https://blueprintjs.com',
  }))
);

const themeUi = scrapeComponentLinks({
  url: 'https://theme-ui.com/components/alert',
  base: 'https://theme-ui.com',
  linkSelector: 'div.css-2bq4yr > ul > li:nth-child(11)> ul > li > a',
}).pipe(
  Effect.map(({ components, ...rest }) => ({
    ...rest,
    name: 'Theme UI',
    site: 'https://theme-ui.com',
    components: components
      .filter((component) => ![/variants/].some((re) => re.test(component.url)))
      .map(({ name, ...c }) => ({
        ...c,
        name: splitCamelcase(name),
      })),
  }))
);

const chakraUi = scrapeComponentLinks({
  url: 'https://chakra-ui.com/docs/components/accordion',
  base: 'https://chakra-ui.com',
  linkSelector: 'nav.sidebar-content > div > div > div > a',
}).pipe(
  Effect.map((data) => ({
    ...data,
    name: 'Chakra UI',
    site: 'https://chakra-ui.com',
  }))
);

const seekOss = scrapeComponentLinksSeekOss({
  url: 'https://seek-oss.github.io/braid-design-system/components/Accordion',
  base: 'https://seek-oss.github.io/braid-design-system/components/',
  linkSelector:
    'body > #app > div > div > div.yude8a6:nth-child(2) > div > div > div.yude86y:nth-child(5) > nav > div > div:nth-child(2) > ul > li > div > div > div > div > div > a > span:nth-child(4) > span',
}).pipe(
  Effect.map((data) => ({
    ...data,
    name: 'Seek-Oss',
    site: 'https://seek-oss.github.io/braid-design-system/',
  }))
);

const radixUi = scrapeComponentLinks({
  url: 'https://www.radix-ui.com/themes/docs/components/alert-dialog',
  base: 'https://www.radix-ui.com',
  linkSelector:
    '#__next > div > div.rt-Flex > div.rt-Box > div > div > div.rt-ScrollAreaViewport > div > div > div > div:nth-child(5) > a',
}).pipe(
  Effect.map((data) => ({
    ...data,
    name: 'Radix UI',
    site: 'https://www.radix-ui.com',
  }))
);

const fluent2Ui = scrapeComponentLinks({
  url: 'https://fluent2.microsoft.design/components/web/react/accordion/usage',
  base: 'https://fluent2.microsoft.design',
  linkSelector:
    'div.nav-main > div.main-list > div:nth-child(4) > div:nth-child(3) > div:nth-child(1) > div:nth-child(n+2) > a',
}).pipe(
  Effect.map((data) => ({
    ...data,
    name: 'Fluent 2 UI',
    site: 'https://fluent2.microsoft.design/',
  }))
);

export const allScrapers = [
  shadCn,
  arkUi,
  zagJs,
  nextUi,
  baseUi,
  arekUi,
  materialUi,
  reactAria,
  parkUi,
  reactBootstrap,
  antDesign,
  semanticUi,
  blueprintJs,
  themeUi,
  chakraUi,
  headlessUi,
  daisyUi,
  seekOss,
  radixUi,
  fluent2Ui,
];
