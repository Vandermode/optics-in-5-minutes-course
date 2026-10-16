self.onmessage = async ({data}) => {
  try {
    const model = await import(data.model);
    const result = await model.compute(data.state, result => self.postMessage({type:'progress',result}));
    self.postMessage({type:'done',result});
  } catch(error) {self.postMessage({type:'error',message:error.message});}
};
