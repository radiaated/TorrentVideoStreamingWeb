const getExtensionFromFileName = (fileName) => {
  return fileName.split(".").pop();
};

export default getExtensionFromFileName;
