export const formatTag = (str: string, withHastag: boolean) => {
  const tag = str
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .replace(/O/g, '0')

  return `${withHastag ? '#' : ''}${tag}`
}
