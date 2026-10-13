<template>
  <div>
    <a href="/about">About</a>
    <a>No href</a>
    <a href="/demo/">Demo</a>
    <a href="/demo">Demo without a trailing slash</a>
    <Teleport to="body">
      <a href="/About">Teleported</a>
    </Teleport>
  </div>
</template>
