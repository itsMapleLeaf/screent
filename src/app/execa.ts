// execa is an ES module, and can't be required normally
const execaPromise = import("execa")
export const importExeca = () => execaPromise.then(({ execa }) => execa)
