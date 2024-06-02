function downloadFile(fileName) {
    const filePath = 'INFORMATIONS/doc' + fileName;
    const link = document.createElement('a');
    link.href = filePath;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}