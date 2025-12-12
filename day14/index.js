export default async function main(){
    
    const inpMsg = document.querySelector("#inp-msg");
    const btnSend = document.querySelector("#btn-send");
    const txtResponse = document.querySelector("#response");

    btnSend.addEventListener("click", async ()=> {
        try {
            const userText = inpMsg.value.trim();
            const answer = await callOllama("", userText);
            console.log(1);
            txtResponse.textContent = answer;
        } catch(err) {
            txtResponse.textContent = "에러:" + err.message;
        }
    })


  const MODEL = "qwen3-vl:2b";
  const OLLAMA_URL = "http://localhost:11434/api/chat";

  // Ollama 요청 함수
  async function callOllama(promptText, userText) {
    const body = {
      model: MODEL,
      messages: [
        {
          role: "system",
          content: promptText || "You are a helpful assistant."
        },
        {
          role: "user",
          content: userText
        }
      ],
      stream: false
    };

    console.log(2);
    const res = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    console.log(3);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Ollama Error: ${res.status} / ${text}`);
    }

    console.log(3);

    const data = await res.json();
    return data.message.content;
  }
}