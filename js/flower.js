onload =() => {
    const c = setTimeout(()=>{
        document.body.classList.add("not-loaded");
        clearTimeout(c);
    },1000);
};