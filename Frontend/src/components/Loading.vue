<template>
    <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-500/10 backdrop-blur-sm">   
        <div class="relative flex items-center justify-center w-24 h-24">
            <div class="absolute inset-0 bg-blue-500/30 rounded-full blur-xl animate-pulse"></div>
            <div class="absolute inset-0 rounded-full border-[3px] border-white/10 border-t-blue-500 border-l-blue-400 animate-spin"></div>
            <div class="absolute inset-3 rounded-full border-[3px] border-transparent border-r-indigo-400 border-b-cyan-300 animate-[spin_1.5s_linear_infinite_reverse]"></div>
            <div class="absolute flex items-center justify-center w-10 h-10 bg-slate-800/80 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.4)] backdrop-blur-sm border border-white/10">
                <i class="fas fa-bolt text-blue-400 text-lg drop-shadow-[0_0_5px_rgba(96,165,250,0.8)] animate-pulse"></i>
            </div>
        </div>
    </div>
</template>