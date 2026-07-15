function formatSlugToTitle(slug) {
  if (!slug) return '';
  
  let title = '';
  try {
    title = decodeURIComponent(slug);
  } catch (e) {
    title = slug;
  }

  title = title.replace(/[-_]+/g, ' ');
  return title.replace(/\b\w/g, char => char.toUpperCase());
}

function extractTitleFromUrl(urlString) {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();
    const pathSegments = url.pathname.split('/').filter(Boolean);
    
    if (pathSegments.length === 0) return null;

    if (hostname.includes('reddit.com')) {
      const indexComments = pathSegments.indexOf('comments');
      if (indexComments !== -1 && pathSegments[indexComments + 2]) {
        return formatSlugToTitle(pathSegments[indexComments + 2]);
      }
    }

    if (hostname.includes('stackoverflow.com') || hostname.includes('stackexchange.com') || hostname.includes('superuser.com') || hostname.includes('askubuntu.com')) {
      const indexQuestions = pathSegments.indexOf('questions');
      if (indexQuestions !== -1 && pathSegments[indexQuestions + 2]) {
        return formatSlugToTitle(pathSegments[indexQuestions + 2]);
      }
    }

    if (hostname.includes('medium.com') || pathSegments[0]?.startsWith('@')) {
      const last = pathSegments[pathSegments.length - 1];
      if (last) {
        const mediumParts = last.split('-');
        if (mediumParts.length > 1) {
          mediumParts.pop();
          return formatSlugToTitle(mediumParts.join('-'));
        }
        return formatSlugToTitle(last);
      }
    }

    if (hostname.includes('github.com')) {
      if (pathSegments.length >= 2) {
        if (pathSegments[2] === 'issues' || pathSegments[2] === 'pull') {
          return `GitHub - ${formatSlugToTitle(pathSegments[1])} #${pathSegments[3] || ''}`;
        }
        return `${formatSlugToTitle(pathSegments[0])} / ${formatSlugToTitle(pathSegments[1])}`;
      }
    }

    if (hostname.includes('quora.com') && pathSegments[0]) {
      return formatSlugToTitle(pathSegments[0]);
    }

    if (hostname.includes('wikipedia.org')) {
      const indexWiki = pathSegments.indexOf('wiki');
      if (indexWiki !== -1 && pathSegments[indexWiki + 1]) {
        return formatSlugToTitle(pathSegments[indexWiki + 1]);
      }
    }

    for (let i = pathSegments.length - 1; i >= 0; i--) {
      const segment = pathSegments[i];
      const isNumeric = /^\d+$/.test(segment);
      const cleanSegment = segment.replace(/\.(html|php|asp|aspx|jsp)$/i, '');
      
      if (!isNumeric && cleanSegment.length > 6 && (cleanSegment.includes('-') || cleanSegment.includes('_'))) {
        return formatSlugToTitle(cleanSegment);
      }
    }

    const lastSegment = pathSegments[pathSegments.length - 1];
    if (lastSegment && isNaN(lastSegment) && lastSegment.length > 5) {
      return formatSlugToTitle(lastSegment.replace(/\.(html|php)$/i, ''));
    }

  } catch (e) {
    return null;
  }
  return null;
}

function processGoogleResults() {
  const links = document.querySelectorAll('a[href]');
  
  links.forEach(link => {
    try {
      const url = new URL(link.href);
      
      if (url.searchParams.has('tl')) {
        url.searchParams.delete('tl');
        if (url.searchParams.has('sl')) url.searchParams.delete('sl');
        
        const cleanUrl = url.toString();
        link.href = cleanUrl;
        
        link.removeAttribute('data-jsarwt');
        link.removeAttribute('data-usg');
        link.removeAttribute('data-ved');

        const originalTitle = extractTitleFromUrl(cleanUrl);
        
        if (originalTitle) {
          const titleElement = link.querySelector('h3');
          if (titleElement) {
            titleElement.innerText = originalTitle;
          } else {
            link.innerText = originalTitle;
          }
        }
      }
    } catch (e) {
      // Ignored
    }
  });
}

processGoogleResults();

const observer = new MutationObserver(() => {
  processGoogleResults();
});

document.addEventListener('DOMContentLoaded', () => {
  processGoogleResults();
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});