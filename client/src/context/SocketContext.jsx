// import { useAuth } from "@/hooks/auth";
// import { connectSocket } from "@/lib/socket";
import { createContext } from "react";
const SocketContext = createContext(null);

export { SocketContext };

// const SocketProvider = ({ children }) => {
//   const { user } = useAuth();
//   //   const [socket, setSocket] = useState(null);

//   const socket = useMemo(() => connectSocket(user?._id), [user]);

//   useEffect(() => {
//     // if (!socket) {
//     //   const sc = connectSocket(user?._id);
//     //   console.log("Socket connected:", sc);
//     //   setSocket(sc);
//     // }

//     socket?.on("connect", () => {
//       console.log("Connected to server", socket);
//     });

//     socket?.on("hello", (data) => {
//       console.log("Received hello event from server:", data);
//     });
//   }, [socket, user]);

//   return (
//     <SocketContext.Provider value={{ socket }}>
//       {children}
//     </SocketContext.Provider>
//   );
// };
