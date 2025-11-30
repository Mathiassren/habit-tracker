import { useState, useEffect } from "react";

const Counter = () => {
  const [count, setCount] = useState(0);

  const CountUp = () => {
    count(count + 1);
  };

  return (
    <>
      <h1>This is a counter</h1>
      <button onClick={CountUp}}>Press me</button>
      <p>This is where the count goes: {count}</p>
    </>
  );
};
