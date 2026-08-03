export type NessComponent = {
  useServerSideProps: () => {
    [key: string]: Function;
  };
};
