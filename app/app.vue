<script setup lang="ts">
const hydrated=ref(false)
onMounted(()=>{hydrated.value=true})
</script>
<template><UApp><div :inert="!hydrated"><NuxtLayout><NuxtPage /></NuxtLayout></div></UApp></template>
