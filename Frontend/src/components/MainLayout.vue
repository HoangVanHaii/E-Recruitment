<script setup>
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';
</script>
<template>
    <div class="main-layout">
        <Header />
        <main>
            <router-view /> 
        </main>
        <Footer />
    </div>
</template>