import React from "react";
import axios from "axios";

function App(props) {

  const [data, setData] = React.useState(null);

  React.useEffect(() => {
      axios('/rest-backend/dummy-data')
        .then((response) => {
        setData(response.data.foo);
      }).catch(() => {
        setData(null);
      });
  });

  return (
    <React.Fragment>
      <p>{data}</p>
    </React.Fragment>
  );
}

export default App;
