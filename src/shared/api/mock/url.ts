// 앱이 상대경로로 부르든 절대 URL로 부르든 잡히도록 origin은 와일드카드로 둔다.
export const url = (path: string) => `*${path}`
