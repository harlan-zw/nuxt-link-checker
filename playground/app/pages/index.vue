<script setup lang="ts">
</script>

<template>
  <div>
    <div class="py-20 text-center">
      <h1 class="text-4xl mb-5 font-bold">
        Nuxt Link Checker
      </h1>
      <p class="text-lg">
        Checking all the links
      </p>
    </div>
    <div class="mb-5">
      <h2 class="text-lg font-bold mb-4">
        Valid
      </h2>
      <LinkDebug to="/#anchor">
        valid anchor
      </LinkDebug>
      <LinkDebug to="/valid">
        valid link
      </LinkDebug>
      <LinkDebug to="/redirect">
        valid link to redirect
      </LinkDebug>
      <LinkDebug to="/ignored">
        valid because ignored
      </LinkDebug>
      <LinkDebug to="mailto:harlan@harlanzw.com">
        mail to link
      </LinkDebug>
      <LinkDebug to="/some-file.pdf">
        file link
      </LinkDebug>
      <LinkDebug to="/about/Billy%20Bob">
        Dynamic Encoded Path
      </LinkDebug>
    </div>
    <div class="mb-5">
      <h2 class="text-lg font-bold mb-4">
        Errors
      </h2>
      <LinkDebug to="">
        missing href
      </LinkDebug>
      <LinkDebug to="//oops">
        double slash
      </LinkDebug>
      <LinkDebug to="//oops">
        double slash
      </LinkDebug>
      <LinkDebug to="/users/👨‍👩‍👦/photos/🌅-vacation">
        non-ascii
      </LinkDebug>
      <LinkDebug to="/ oops">
        whitespace
      </LinkDebug>
      <LinkDebug to="/oopsthisisamistake">
        uppercase
      </LinkDebug>
      <LinkDebug to="this is a very bad link">
        very bad link
      </LinkDebug>
      <LinkDebug to="/abot">
        page typo with magic fix
      </LinkDebug>
      <LinkDebug to="/#broken-anchor">
        broken anchor
      </LinkDebug>
      <LinkDebug to="/404link">
        404 links
      </LinkDebug>
      <LinkDebug to="https://example.com/absolute">
        absolute 404 link
      </LinkDebug>
      <LinkDebug to="javascript:history.back()">
        javascript link
      </LinkDebug>
      <LinkDebug to="/error">
        to an error page
      </LinkDebug>
      <LinkDebug to="/completely-broken/">
        error and warning
      </LinkDebug>
      <LinkDebug to="/abt">
        page typo with magic fix - AGAIN 123
      </LinkDebug>
      <LinkDebug to="https://nuxt.com/docs/">
        nuxt.com - remote URL
      </LinkDebug>
    </div>
    <div>
      <h2 class="text-lg font-bold mb-4">
        Warnings test
      </h2>
      <LinkDebug to="/trailingslash/">
        trailing slash
      </LinkDebug>
      <LinkDebug to="/redirect">
        redirect link
      </LinkDebug>
      <LinkDebug to="https://nuxt-link-checker.com/about">
        Absolute internal link
      </LinkDebug>
    </div>
    <div id="anchor" />
  </div>
</template>
