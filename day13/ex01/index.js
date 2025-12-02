export default async function main(){
    const main_menu_screen = document.querySelector("#main-menu-screen");
    const credit_screen = document.querySelector("#credit-screen");
    const option_screen = document.querySelector("#option-screen");
    const game_screen = document.querySelector("#game-screen");
    let current_screen = 'menu';

    let currentIndex = 0;
    const menuitems = document.querySelectorAll(".menu-item");
    const max_itemIndex = menuitems.length;

    menuitems[currentIndex].classList.add("select");

    window.addEventListener("keydown", (e)=>{
        if (current_screen == "menu"){
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
                const _action = _select_menuItem.dataset.action;
                
                if (_action == "credit"){
                    main_menu_screen.classList.add("hide");
                    credit_screen.classList.remove("hide");
                    current_screen = "credit";
                } else if (_action == "option"){
                    main_menu_screen.classList.add("hide");
                    option_screen.classList.remove("hide");
                    current_screen = "option";
                } else if (_action == "new-game"){
                    main_menu_screen.classList.add("hide");
                    game_screen.classList.remove("hide");
                    current_screen = "game";
                }
            }
            menuitems[currentIndex].classList.add("select");
        }
        else if (current_screen == "credit" || current_screen == "option" || current_screen=="game"){
            if (e.key == "Enter"){
                option_screen.classList.add("hide");
                credit_screen.classList.add("hide");
                main_menu_screen.classList.remove("hide");
                current_screen = "menu";
            }
        }
    })
}