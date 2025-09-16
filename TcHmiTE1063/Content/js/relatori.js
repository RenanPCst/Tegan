// Keep these lines for a best effort IntelliSense of Visual Studio 2017 and higher.
/// <reference path="./../../../Packages/Beckhoff.TwinCAT.HMI.Framework.14.3.212/runtimes/native1.12-tchmi/TcHmi.d.ts" />
// Relatorio.js

/*function gerarRelatorioPDF() {
    // Cria uma nova instância da jsPDF
    const doc = new jspdf.jsPDF();

    // Adiciona o título do documento
    doc.setFontSize(22);
    doc.text("MPS Model 4500 Sample Recovery System", 10, 20, { align: "left" });

    // Adiciona a data atual
    const data = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();

    doc.setFontSize(14);
    doc.text("Pump Calibration Report", 10, 30);
    doc.setFontSize(10);
    doc.text(`Print Date: ${data}`, 10, 40);
    doc.text(`${time}`, 50, 40);

    // Adiciona conteúdo dinâmico (exemplo)
    doc.setFontSize(14);
    doc.line(200, 50, 0, 50, 'F'); //(x1 widthR,y1 heightR,x2 widthL,y2 heightL,style)
    doc.text("- Peças produzidas: 1250", 10, 60);
    doc.text("- Tempo de ciclo médio: 2.3s", 10, 70);

    // Salva o arquivo no browser do cliente
    doc.save('MPS Model_v1.pdf');
}*/

// Relatorio.js


async function gerarRelatorioPDF(jsonString) {
    try {
        // 1. Acessar e ler o arquivo JSON do projeto
        /*const resposta =  await readPlcJson();//await fetch('Content/reportASRS.json');

        if (!resposta.ok) {
            throw new Error(`Erro ao carregar o arquivo JSON: ${resposta.status}`);
        }

        const dadosDoJSON = await resposta.json();*/

        const dadosDoJSON = JSON.parse(jsonString);

        // 2. Criar a instância jsPDF
        const doc = new jspdf.jsPDF();
        
        // Define a fonte padrão para o texto
        doc.setFont("helvetica", "normal");
        
        // 3. Adicionar as informações do cabeçalho (reportInfo)
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(dadosDoJSON.reportInfo.reportName, 10, 15);
        doc.text(dadosDoJSON.reportInfo.reoportSubName, 10, 20);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(14);
        doc.text(`Report Date: ${dadosDoJSON.reportInfo.reportDate}`, 10, 30);
        doc.text(`System ID: ${dadosDoJSON.reportInfo.systemID}`, 80, 30);
        doc.text(`Database Name: ${dadosDoJSON.reportInfo.databaseName}`, 80, 35);
        doc.setFontSize(8);
        doc.text(`Page ${dadosDoJSON.reportInfo.page}`, 200, 5, { align: "center" });
        doc.setFontSize(14);
        doc.text(`Printed by: ${dadosDoJSON.reportInfo.printedBy}`, 80, 40);
        
        
        // 4. Adicionar as informações de calibração (calibrationInfo)
        doc.setFontSize(12);
        doc.text(`Calibration #: ${dadosDoJSON.calibrationInfo.calibrationNumber.toString()}`, 10, 55);
        doc.text(`User ID: ${dadosDoJSON.calibrationInfo.userID}`, 10, 60);
        doc.text(`Density: ${dadosDoJSON.calibrationInfo.density.toString()}`, 10, 65);
        doc.text(`Solvent: ${dadosDoJSON.calibrationInfo.solvent}`, 80, 55);
        doc.text(`Pump: ${dadosDoJSON.calibrationInfo.pump}`, 80, 60);
        doc.text(`Sys Master List Rev: ${dadosDoJSON.calibrationInfo.sysMasterListRev.toString()}`, 80, 65);
        doc.text(`Solvent Revision: ${dadosDoJSON.calibrationInfo.solventRevision.toString()}`, 140, 55);
        doc.text(`Allowable Failures: ${dadosDoJSON.calibrationInfo.allowableFailures.toString()}`, 140, 60);
        doc.text(`Replicates: ${dadosDoJSON.calibrationInfo.replicates.toString()}`, 140, 65);
        doc.text(`Call Interval (Days): ${dadosDoJSON.calibrationInfo.calIntervalDays.toString()}`, 140, 70);

        // Adicione outras informações de calibração aqui, se necessário

        // 5. Adicionar o cabeçalho da tabela
        let yPosicao = 80;
        let xPosition = 10;
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("Date/Time", xPosition+15, yPosicao, { align: "center" });
        doc.text("Pump\n#", xPosition+35, yPosicao, { align: "center" });
        doc.text("Step", xPosition+47, yPosicao, { align: "center" });
        doc.text("Tare Wt\n(g)", xPosition+67, yPosicao, { align: "center" });
        doc.text("Gross Wt\n(g)", xPosition+83, yPosicao, { align: "center" });
        doc.text("Net Wt\n(g)", xPosition+99, yPosicao, { align: "center" });
        doc.text("Net\nVolume", xPosition+115, yPosicao, { align: "center" });
        doc.text("Target\nVolume", xPosition+131, yPosicao, { align: "center" });
        doc.text("Difference\n%", xPosition+147, yPosicao, { align: "center" });
        doc.text("Criteria", xPosition+163, yPosicao, { align: "center" });
        doc.text("Pump\nRevs", xPosition+179, yPosicao, { align: "center" });

        // Adiciona uma linha para separar o cabeçalho dos dados
        yPosicao += 5;
        doc.line(xPosition, yPosicao, 200, yPosicao);
        yPosicao += 5;

        // 6. Adicionar os dados da tabela (calibrationData)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        dadosDoJSON.calibrationData.forEach(item => {
            doc.text(item.dateTime, xPosition, yPosicao);
            doc.text(item.pumpNumber.toString(), xPosition+34, yPosicao);
            doc.text(item.step, xPosition+42, yPosicao);
            doc.text(item.tareWt_g.toFixed(3), xPosition+67, yPosicao, { align: "center" });
            doc.text(item.grossWt_g.toFixed(3), xPosition+83, yPosicao, { align: "center" });
            doc.text(item.netWt_g.toFixed(3), xPosition+99, yPosicao, { align: "center" });
            doc.text(item.netVolume.toFixed(2), xPosition+115, yPosicao, { align: "center" });
            doc.text(item.targetVolume_ul.toFixed(2), xPosition+131, yPosicao, { align: "center" });
            doc.text(item.difference_percent.toFixed(2), xPosition+147, yPosicao, { align: "center" });
            doc.text(item.criteria.toFixed(2), xPosition+163, yPosicao, { align: "center" });
            doc.text(item.pumpRev.toString(), xPosition+179, yPosicao, { align: "center" });
            
            yPosicao += 5; // Aumenta a posição vertical para a próxima linha
        });

        // 7. Salvar o arquivo PDF
        doc.save(`${dadosDoJSON.reportInfo.fileName}.pdf`);

    } catch (erro) {
        console.error("Falha ao gerar o PDF:", erro);
        alert("Ocorreu um erro ao gerar o relatório. Verifique o console do browser para mais detalhes.");
    }
}

async function PostRunReport(jsonString) {
    try {

        const dadosDoJSON = JSON.parse(jsonString);

        // 2. Criar a instância jsPDF
        const doc = new jspdf.jsPDF();
        
        // Define a fonte padrão para o texto
        doc.setFont("helvetica", "normal");
        
        // 3. Adicionar as informações do cabeçalho (reportInfo)
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(dadosDoJSON.reportInfo.reportName, 10, 15);
        doc.text(dadosDoJSON.reportInfo.reoportSubName, 10, 20);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(14);
        doc.text(`Report Date: ${dadosDoJSON.reportInfo.reportDate}`, 10, 30);
        doc.text(`System ID: ${dadosDoJSON.reportInfo.systemID}`, 80, 30);
        doc.text(`Database Name: ${dadosDoJSON.reportInfo.databaseName}`, 80, 35);
        doc.setFontSize(8);
        doc.text(`Page ${dadosDoJSON.reportInfo.page}`, 200, 5, { align: "center" });
        doc.setFontSize(14);
        doc.text(`Printed by: ${dadosDoJSON.reportInfo.printedBy}`, 80, 40);
        
        
        // 4. Adicionar as informações de calibração (calibrationInfo)
        doc.setFontSize(12);
        doc.text(`Calibration #: ${dadosDoJSON.calibrationInfo.calibrationNumber.toString()}`, 10, 55);
        doc.text(`User ID: ${dadosDoJSON.calibrationInfo.userID}`, 10, 60);
        doc.text(`Density: ${dadosDoJSON.calibrationInfo.density.toString()}`, 10, 65);
        doc.text(`Solvent: ${dadosDoJSON.calibrationInfo.solvent}`, 80, 55);
        doc.text(`Pump: ${dadosDoJSON.calibrationInfo.pump}`, 80, 60);
        doc.text(`Sys Master List Rev: ${dadosDoJSON.calibrationInfo.sysMasterListRev.toString()}`, 80, 65);
        doc.text(`Solvent Revision: ${dadosDoJSON.calibrationInfo.solventRevision.toString()}`, 140, 55);
        doc.text(`Allowable Failures: ${dadosDoJSON.calibrationInfo.allowableFailures.toString()}`, 140, 60);
        doc.text(`Replicates: ${dadosDoJSON.calibrationInfo.replicates.toString()}`, 140, 65);
        doc.text(`Call Interval (Days): ${dadosDoJSON.calibrationInfo.calIntervalDays.toString()}`, 140, 70);

        // Adicione outras informações de calibração aqui, se necessário

        // 5. Adicionar o cabeçalho da tabela
        let yPosicao = 80;
        let xPosition = 10;
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("Date/Time", xPosition+15, yPosicao, { align: "center" });
        doc.text("Pump\n#", xPosition+35, yPosicao, { align: "center" });
        doc.text("Step", xPosition+47, yPosicao, { align: "center" });
        doc.text("Tare Wt\n(g)", xPosition+67, yPosicao, { align: "center" });
        doc.text("Gross Wt\n(g)", xPosition+83, yPosicao, { align: "center" });
        doc.text("Net Wt\n(g)", xPosition+99, yPosicao, { align: "center" });
        doc.text("Net\nVolume", xPosition+115, yPosicao, { align: "center" });
        doc.text("Target\nVolume", xPosition+131, yPosicao, { align: "center" });
        doc.text("Difference\n%", xPosition+147, yPosicao, { align: "center" });
        doc.text("Criteria", xPosition+163, yPosicao, { align: "center" });
        doc.text("Pump\nRevs", xPosition+179, yPosicao, { align: "center" });

        // Adiciona uma linha para separar o cabeçalho dos dados
        yPosicao += 5;
        doc.line(xPosition, yPosicao, 200, yPosicao);
        yPosicao += 5;

        // 6. Adicionar os dados da tabela (calibrationData)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        dadosDoJSON.calibrationData.forEach(item => {
            doc.text(item.dateTime, xPosition, yPosicao);
            doc.text(item.pumpNumber.toString(), xPosition+34, yPosicao);
            doc.text(item.step, xPosition+42, yPosicao);
            doc.text(item.tareWt_g.toFixed(3), xPosition+67, yPosicao, { align: "center" });
            doc.text(item.grossWt_g.toFixed(3), xPosition+83, yPosicao, { align: "center" });
            doc.text(item.netWt_g.toFixed(3), xPosition+99, yPosicao, { align: "center" });
            doc.text(item.netVolume.toFixed(2), xPosition+115, yPosicao, { align: "center" });
            doc.text(item.targetVolume_ul.toFixed(2), xPosition+131, yPosicao, { align: "center" });
            doc.text(item.difference_percent.toFixed(2), xPosition+147, yPosicao, { align: "center" });
            doc.text(item.criteria.toFixed(2), xPosition+163, yPosicao, { align: "center" });
            doc.text(item.pumpRev.toString(), xPosition+179, yPosicao, { align: "center" });
            
            yPosicao += 5; // Aumenta a posição vertical para a próxima linha
        });

        // 7. Salvar o arquivo PDF
        doc.save(`${dadosDoJSON.reportInfo.fileName}.pdf`);

    } catch (erro) {
        console.error("Falha ao gerar o PDF:", erro);
        alert("Ocorreu um erro ao gerar o relatório. Verifique o console do browser para mais detalhes.");
    }
}
