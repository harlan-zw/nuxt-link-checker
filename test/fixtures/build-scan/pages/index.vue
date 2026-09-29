<template>
  <div>
    <a href="/about">About</a>
    <a>No href</a>
    <Teleport to="body">
      <a href="/About">Teleported</a>
    </Teleport>
  </div>
</template>
