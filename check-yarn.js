if (!/yarn/.test(process.env.npm_execpath || '')) {
  console.warn(
    'This repository requires yarn, yarn.lock is important!'
  )
  process.exit(1)
}