<script setup lang="ts">

const { data } = await useFetch('/api/test');

</script>

<template>
    <div>
        <h1>Welcome to the Home Page</h1>
        <p>Data from API: {{ data }}</p>
    </div>
</template>

<style scoped>

</style>