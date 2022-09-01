export default (component) => {
  switch (component.type.toLowerCase()) {
    case 'application':
      return 'mdi-application';
    case 'component':
      return 'mdi-puzzle';
  }
  return undefined;
};
