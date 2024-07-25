export function serverQueryContent() {
  // does not need to do anything
  return {
    async findOne() {
      return false
    },
    async find() {
      return []
    },
  }
}
