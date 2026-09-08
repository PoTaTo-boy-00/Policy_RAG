API
port 8080
/upload
{
    body : files
    res: {
         success,
    pathIds,
    }
}



/query
{
    body:  { question, pathIds }
    res:{
        queryId,
    sources,
    }
}

/query/stream?queryId=<queryId>
{
    query: {queryId}
    res:{
        chunks
    }
}