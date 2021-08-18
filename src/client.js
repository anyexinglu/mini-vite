const overlayId = "saber-error-overlay";
// use server configuration, then fallback to inference
const socketProtocol = "ws";
const socketHost = "localhost:5100";
const HMR_HEADER = "saber-hmr";

let socket;

try {
  const url = `${socketProtocol}://${socketHost}`;
  socket = new WebSocket(url, HMR_HEADER);

  socket.onopen = function () {
    // Web Socket 已连接上，使用 send() 方法发送数据
    socket.send("发送数据");
  };
  // Listen for messages
  socket.onmessage = async ({ data }) => {
    const payload = JSON.parse(data);
    console.log(`handle Message: `, payload);
    switch (payload.type) {
      case "connected":
        console.log(`[vite] connected.`);
        setInterval(() => socket.send("ping"), 4000);
        break;
      case "update":
        payload.updates.forEach(async update => {
          const { type, timestamp, path } = update;
          if (type === "js-update") {
            await import(`${path.replace("/src", "")}?import&t=${timestamp}`);
          }
        });
    }
  };

  socket.onclose = function (event) {
    // handle error event
    console.error("WebSocket onClose:", event);
  };
  socket.onerror = function (event) {
    // handle error event
    console.error("WebSocket error observed:", event);
  };
} catch (e) {
  console.log("...socket e", e);
}

const base = "/";
