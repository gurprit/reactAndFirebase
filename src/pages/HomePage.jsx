import React from "react";
import CreateList from "../components/CreateList";
import Lists from "../components/Lists";
import Layout from "../components/shared/Layout";
import { UserContext } from '../index'

function HomePage() {
  const user = React.useContext(UserContext);

  return (
    <Layout>
      <CreateList user={user} />
      <Lists user={user} />
    </Layout>
  );
}

export default HomePage;
