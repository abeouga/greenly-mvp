const apiUrl = process.env.KUSAKARI_CANVAS_E2E_API_URL;

if (!apiUrl) {
  throw new Error('Playwright設定でKUSAKARI_CANVAS_E2E_API_URLを設定してください。');
}

export const api = `${apiUrl}/api`;
