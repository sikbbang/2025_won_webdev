export default async function main(){
    const main_menu_screen = document.querySelector("#main-menu-screen");
    const credit_screen = document.querySelector("#credit-screen");
    let current_screen = 'main-menu-screen';

    let currentIndex = 0;
    const menuitems = document.querySelectorAll(".menu-item");
    const max_itemIndex = menuitems.length;

    menuitems[currentIndex].classList.add("select");

    window.addEventListener("keydown", (e)=>{
        if (current_screen == "main-menu-screen"){
            if (e.key == "ArrowUp"){
                menuitems[currentIndex].classList.remove("select");
                currentIndex--;
                if (currentIndex < 0){
                    currentIndex=max_itemIndex-1;
                }
            } else if (e.key == "ArrowDown"){
                menuitems[currentIndex].classList.remove("select");
                currentIndex++;
                currentIndex %= max_itemIndex;
            } else if (e.key == "Enter"){
                const _select_menuItem = menuitems[currentIndex];
                console.log(_select_menuItem);
                const _action = _select_menuItem.dataset.action;
                
                if (_action == "credit"){
                    main_menu_screen.classList.add("hide");
                    credit_screen.classList.remove("hide");
                    current_screen = _action;
                }
            }
            menuitems[currentIndex].classList.add("select");
        }
        else if (current_screen == "credit"){
            if (e.key == "Enter"){
                credit_screen.classList.add("hide");
                main_menu_screen.classList.remove("hide");
                current_screen = "main-menu-screen";
            }
        }
    })
}