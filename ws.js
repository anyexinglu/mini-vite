import WebSocket, { WebSocketServer } from "ws";

const HMR_HEADER = "saber-hmr";

export function createWebSocketServer(wsServer) {
  let wss = new WebSocketServer({ noServer: true });

  wsServer.on("upgrade", (req, socket, head) => {
    console.log("...upgrade");
    if (req.headers["sec-websocket-protocol"] === HMR_HEADER) {
      wss.handleUpgrade(req, socket, head, ws => {
        wss.emit("connection", ws, req);
      });
    }
  });

  wss.on("connection", socket => {
    console.log(`has connected`);
    socket.send(JSON.stringify({ type: "connected" }));
  });

  wss.on("error", e => {
    console.error(`WebSocket error:\n${e.stack || e.message}`);
    if (e.code !== "EADDRINUSE") {
      console.error(`WebSocket server error:\n${e.stack || e.message}`);
    }
  });

  return {
    send(payload) {
      if (payload.type === "error" && !wss.clients.size) {
        console.log("..err");
        return;
      }

      const stringified = JSON.stringify(payload);
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(stringified);
        }
      });
    },

    close() {
      return new Promise((resolve, reject) => {
        wss.close(err => {
          if (err) {
            reject(err);
          } else {
            if (wsServer) {
              wsServer.close(err => {
                if (err) {
                  reject(err);
                } else {
                  resolve(undefined);
                }
              });
            } else {
              resolve(undefined);
            }
          }
        });
      });
    },
  };
}
