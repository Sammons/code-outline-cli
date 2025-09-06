// Sample React TSX file for testing
import React, { useState, useEffect } from 'react';

interface Props {
  title: string;
  count?: number;
}

const Button: React.FC<Props> = ({ title, count = 0 }) => {
  const [clicks, setClicks] = useState(count);

  useEffect(() => {
    console.log(`Button clicked ${clicks} times`);
  }, [clicks]);

  const handleClick = () => {
    setClicks((prev) => prev + 1);
  };

  return (
    <button onClick={handleClick}>
      {title}: {clicks}
    </button>
  );
};

class ClassComponent extends React.Component<Props> {
  state = {
    value: 0,
  };

  componentDidMount() {
    console.log('Component mounted');
  }

  render() {
    return (
      <div>
        <h1>{this.props.title}</h1>
        <p>Value: {this.state.value}</p>
      </div>
    );
  }
}

export default Button;
export { ClassComponent };
