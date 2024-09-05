import { MARKED_OPTIONS, MarkedOptions, MarkedRenderer } from 'ngx-markdown';
import { routes } from './app.routes';

// function that returns `MarkedOptions` with renderer override
export function markedOptionsFactory(): MarkedOptions {
  const renderer = new MarkedRenderer();
  const linkRenderer = renderer.link;
  const validRelative = routes.map(x => `/${x.path}`).filter(x => x && x.length > 0);
  console.log(validRelative.join(','));
  renderer.link = (href, title, text) => {
    const html = linkRenderer.call(renderer, href, title, text);

    const valid = validRelative.find(x => x === href);
    return valid ? html : html.replace(/^<a /, '<a role="link" tabindex="0" target="_blank" rel="nofollow noopener noreferrer" ');
  };
  renderer.blockquote = (text: string) => {
    return '<blockquote class="blockquote"><p>' + text + '</p></blockquote>';
  };

  return {
    renderer: renderer,
    gfm: true,
    breaks: false,
    pedantic: false,
  };
}
