export const sendMove = (move: string, dataChannelRef, setLog) => {
  if (dataChannelRef.current?.readyState === "open") {
    dataChannelRef.current.send(move);
    setLog((prevLog) => [...prevLog, `You: ${move}`]);
  }
};
