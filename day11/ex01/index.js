export default async function main(){
    const menuitems = document.querySelectorAll(".menu-item");
    let currentIndex = 0;

    menuitems[currentIndex].classList.add("select");

    window.addEventListener("keydown", (e)=>{
        if (e.key == "ArrowUp"){
            menuitems[currentIndex].classList.remove("select");
            currentIndex--;
            if (currentIndex < 0){
                currentIndex=3;
            }
        } else if (e.key == "ArrowDown"){
            menuitems[currentIndex].classList.remove("select");
            currentIndex++;
            currentIndex %= 4;
        }
        menuitems[currentIndex].classList.add("select");
    })
}