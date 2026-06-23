import UAParser from 'ua-parser-js';

export const parseUserAgent = (userAgentString) => {
  if (!userAgentString) {
    return { browser: 'Unknown Browser', os: 'Unknown OS' };
  }
  const parser = new UAParser(userAgentString);
  const result = parser.getResult();
  return {
    browser: `${result.browser.name || 'Unknown Browser'} ${result.browser.version || ''}`.trim(),
    os: `${result.os.name || 'Unknown OS'} ${result.os.version || ''}`.trim()
  };
};

export default parseUserAgent;
