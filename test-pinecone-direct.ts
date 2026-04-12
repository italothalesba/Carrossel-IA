// Teste direto da API do Pinecone
const apiKey = "pcsk_2Vwh5P_6p4HtCLe6rvhtGW8AFpA9urkATi8bjopqU4365BdaYJiiW6wUdiMdwNKZRFdRAq";

console.log("Testando conexão direta com Pinecone...");
console.log("API Key length:", apiKey.length);
console.log("API Key:", apiKey.substring(0, 15) + "...");

async function test() {
  try {
    const response = await fetch("https://api.pinecone.io/indexes", {
      headers: {
        "Api-Key": apiKey
      }
    });
    
    console.log("\nStatus:", response.status);
    console.log("Status Text:", response.statusText);
    
    const body = await response.text();
    console.log("\nResponse:", body.substring(0, 500));
    
    if (response.ok) {
      console.log("\n✅ CONEXÃO BEM-SUCEDIDA!");
      const data = JSON.parse(body);
      console.log("Índices:", JSON.stringify(data, null, 2));
    } else {
      console.log("\n❌ CONEXÃO FALHOU!");
      console.log("A API key foi rejeitada pelo servidor.");
    }
  } catch (error: any) {
    console.error("\n❌ ERRO:", error.message);
  }
}

test();
