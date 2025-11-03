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
        alert("An Error Occured! Verify the console for more details.");
    }
};

async function genPostRunReport(jsonString) {
    try {

        const dadosDoJSON = JSON.parse(jsonString);
        let yPosicao = 80;
        let xPosition = 10;

        // 2. Criar a instância jsPDF
        const doc = new jspdf.jsPDF();
        
        // Define a fonte padrão para o texto
        doc.setFont("helvetica", "normal");
        
        // 3. Add the Head Information (reportInfo)
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(dadosDoJSON.reportInfo.reportName, 10, 15);
        doc.text(dadosDoJSON.reportInfo.reoportSubName, 10, 25);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Report Date: ${dadosDoJSON.reportInfo.reportDate}`, 10, 35);
        doc.text(`System ID: ${dadosDoJSON.reportInfo.systemID}`, 100, 35);
        doc.text(`Database Name: ${dadosDoJSON.reportInfo.databaseName}`, 100, 40);
        doc.text(`Printed by: ${dadosDoJSON.reportInfo.printedBy}`, 100, 45);
        doc.setFontSize(8);
        doc.text(`Page ${dadosDoJSON.reportInfo.page}`, 200, 5, { align: "center" });        
        // Create a line
        doc.line(10, 50, 200, 50);
        
        // 4. Add the Parameters Information (parametersInfo)
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`Method Name: `, 35, 55, { align: "right" });
        doc.text(`Revision: `, 35, 60, { align: "right" });
        doc.text(`Created By: `, 35, 65, { align: "right" });
        doc.text(`On: `, 35, 70, { align: "right" });
        doc.setFont("helvetica", "normal");
        doc.text(dadosDoJSON.parametersInfo.methodName, 35, 55);
        doc.text(dadosDoJSON.parametersInfo.revision.toString(), 35, 60);
        doc.text(dadosDoJSON.parametersInfo.createdBy, 35, 65);
        doc.text(dadosDoJSON.parametersInfo.createdDate, 35, 70);
        
        //Step Parameters Table
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Step Parameters", xPosition, yPosicao, { align: "left" });
        doc.text("Rinse 1", xPosition+60, yPosicao, { align: "center" });
        doc.text("Rinse 2", xPosition+80, yPosicao, { align: "center" });
        doc.text("Wash 1", xPosition+100, yPosicao, { align: "center" });
        doc.text("Wash 2", xPosition+120, yPosicao, { align: "center" });
        doc.text("Solvent #", xPosition+35, yPosicao+10, { align: "right" });
        doc.text("Time (sec)", xPosition+35, yPosicao+15, { align: "right" });
        doc.text("Velocity (RPM)", xPosition+35, yPosicao+20, { align: "right" });
        
        // Create a line
        yPosicao += 5;
        doc.line(xPosition, yPosicao, 145, yPosicao);
        yPosicao += 5;
        doc.line(50, 75, 50, 105);
        doc.line(xPosition, 105, 145, 105);
        
        // Add Parameter Table Data
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(dadosDoJSON.parametersInfo.stepParameters.solv_R1.toString(), xPosition+60, yPosicao, { align: "center" });
        doc.text(dadosDoJSON.parametersInfo.stepParameters.solv_R2.toString(), xPosition+80, yPosicao, { align: "center" });
        doc.text(dadosDoJSON.parametersInfo.stepParameters.solv_W1.toString(), xPosition+100, yPosicao, { align: "center" });
        doc.text(dadosDoJSON.parametersInfo.stepParameters.solv_W2.toString(), xPosition+120, yPosicao, { align: "center" });
        yPosicao += 5;
        doc.text(dadosDoJSON.parametersInfo.stepParameters.stepTime_R1.toString(), xPosition+60, yPosicao, { align: "center" });
        doc.text(dadosDoJSON.parametersInfo.stepParameters.stepTime_R2.toString(), xPosition+80, yPosicao, { align: "center" });
        doc.text(dadosDoJSON.parametersInfo.stepParameters.stepTime_W1.toString(), xPosition+100, yPosicao, { align: "center" });
        doc.text(dadosDoJSON.parametersInfo.stepParameters.stepTime_W2.toString(), xPosition+120, yPosicao, { align: "center" });
        yPosicao += 5;
        doc.text(dadosDoJSON.parametersInfo.stepParameters.stepRpm_R1.toString(), xPosition+60, yPosicao, { align: "center" });
        doc.text(dadosDoJSON.parametersInfo.stepParameters.stepRpm_R2.toString(), xPosition+80, yPosicao, { align: "center" });
        doc.text(dadosDoJSON.parametersInfo.stepParameters.stepRpm_W1.toString(), xPosition+100, yPosicao, { align: "center" });
        doc.text(dadosDoJSON.parametersInfo.stepParameters.stepRpm_W2.toString(), xPosition+120, yPosicao, { align: "center" });
        yPosicao += 5; 
        //---------------------
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Misc. Parameters", 150, yPosicao-25, { align: "left" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(`Soak Time: ${dadosDoJSON.parametersInfo.soakTime.toString()}`, 150, 85);
        doc.text(`Agitate 1 Time: ${dadosDoJSON.parametersInfo.agitateTime1.toString()}`, 150, 90);
        doc.text(`Agitate 2 Time: ${dadosDoJSON.parametersInfo.agitateTime2.toString()}`, 150, 95);
        doc.text(`Vials to Fill: ${dadosDoJSON.parametersInfo.vialToFill.toString()}`, 150, 100);
        doc.text(`Vial Prime Vol: ${dadosDoJSON.parametersInfo.vialPrimeVol.toString()}`, 150, 105);
        doc.text(`Vial 1 Fill Vol: ${dadosDoJSON.parametersInfo.vialFillVol1.toString()}`, 150, 110);
        doc.text(`Vial 2-4 Fill Vol: ${dadosDoJSON.parametersInfo.vialsFillVol24.toString()}`, 150, 115);
        doc.text(`Air Dry Time: ${dadosDoJSON.parametersInfo.airDryTime.toString()}`, 150, 120);

        yPosicao += 20;

        // 5. Add Volume Data Table
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Volume Data", xPosition+15, yPosicao, { align: "center" });
        doc.setFontSize(8);
        doc.text("Pump", xPosition+15, yPosicao+5, { align: "center" });
        doc.text("Stage", xPosition+35, yPosicao+5, { align: "center" });
        doc.text("Rinse 1", xPosition+47, yPosicao+5, { align: "center" });
        doc.text("Rinse 2", xPosition+67, yPosicao+5, { align: "center" });
        doc.text("Wash 1", xPosition+83, yPosicao+5, { align: "center" });
        doc.text("Wash 2", xPosition+99, yPosicao+5, { align: "center" });
        // Create a line
        yPosicao += 10;
        doc.line(xPosition, yPosicao, 200, yPosicao);
        yPosicao += 5;
        
        // 6. Add Data into the Table (volumeData)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        dadosDoJSON.volumeData.forEach(item => {
            doc.text(item.pump.toString(), xPosition+15, yPosicao, { align: "center" });
            doc.text(item.stage, xPosition+35, yPosicao, { align: "center" });
            doc.text(item.rinse1.toString(), xPosition+47, yPosicao, { align: "center" });
            doc.text(item.rinse2.toFixed(3), xPosition+67, yPosicao, { align: "center" });
            doc.text(item.wash1.toFixed(3), xPosition+83, yPosicao, { align: "center" });
            doc.text(item.wash2.toFixed(3), xPosition+99, yPosicao, { align: "center" });
            
            yPosicao += 5; // Aumenta a posição vertical para a próxima linha
        });
        // Create a line
        doc.line(xPosition, yPosicao, 200, yPosicao);

        yPosicao += 5;
        xPosition += 45;

        // 7. Add Run Events data
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Run Events", xPosition, yPosicao, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        yPosicao += 2.5;
        doc.text(`Analyst:  `, xPosition, yPosicao+2.5, { align: "right" });
        doc.text(dadosDoJSON.parametersInfo.soakTime.toString(), xPosition, yPosicao+2.5, { align: "left" });
        doc.text(`Run No:  `, xPosition, yPosicao+5, { align: "right" });
        doc.text(dadosDoJSON.parametersInfo.agitateTime1.toString(), xPosition, yPosicao+5, { align: "left" });
        doc.text(`Calibration No:  `, xPosition, yPosicao+7.5, { align: "right" });
        doc.text(dadosDoJSON.parametersInfo.agitateTime2.toString(), xPosition, yPosicao+7.5, { align: "left" });
        doc.text(`Comment:  `, xPosition, yPosicao+10, { align: "right" });
        doc.text(dadosDoJSON.parametersInfo.vialToFill.toString(), xPosition, yPosicao+10, { align: "left" });
        doc.text(`--------------   `, xPosition, yPosicao+12.5, { align: "right" });
        doc.text(`Software Version:  `, xPosition, yPosicao+15, { align: "right" });
        doc.text(dadosDoJSON.parametersInfo.vialFillVol1.toString(), xPosition, yPosicao+15, { align: "left" });
        doc.text(`System Master Revision:  `, xPosition, yPosicao+17.5, { align: "right" });
        doc.text(dadosDoJSON.parametersInfo.vialsFillVol24.toString(), xPosition, yPosicao+17.5, { align: "left" });
        doc.text(`Meter Velocity:  `, xPosition, yPosicao+20, { align: "right" });
        doc.text(dadosDoJSON.parametersInfo.airDryTime.toString(), xPosition, yPosicao+20, { align: "left" });
        doc.text(`Run Velocity:  `, xPosition, yPosicao+22.5, { align: "right" });
        doc.text(dadosDoJSON.parametersInfo.airDryTime.toString(), xPosition, yPosicao+22.5, { align: "left" });
        doc.text(`Empty Tubes Factor:  `, xPosition, yPosicao+25, { align: "right" });
        doc.text(dadosDoJSON.parametersInfo.airDryTime.toString(), xPosition, yPosicao+25, { align: "left" });
        doc.text(`Fill Tubes Factor:  `, xPosition, yPosicao+27.5, { align: "right" });
        doc.text(dadosDoJSON.parametersInfo.airDryTime.toString(), xPosition, yPosicao+27.5, { align: "left" });
        doc.text(`--------------   `, xPosition, yPosicao+30, { align: "right" });
        doc.text(`Solvent#1 Name & Revision:  `, xPosition, yPosicao+32.5, { align: "right" });
        doc.text(dadosDoJSON.parametersInfo.airDryTime.toString(), xPosition, yPosicao+32.5, { align: "left" });
        doc.text(`Solvent#2 Name & Revision:  `, xPosition, yPosicao+35, { align: "right" });
        doc.text(dadosDoJSON.parametersInfo.airDryTime.toString(), xPosition, yPosicao+35, { align: "left" });
        doc.text(`Solvent#3 Name & Revision:  `, xPosition, yPosicao+37.5, { align: "right" });
        doc.text(dadosDoJSON.parametersInfo.airDryTime.toString(), xPosition, yPosicao+37.5, { align: "left" });
        doc.text(`Solvent#4 Name & Revision:  `, xPosition, yPosicao+40, { align: "right" });
        doc.text(dadosDoJSON.parametersInfo.airDryTime.toString(), xPosition, yPosicao+40, { align: "left" });
        doc.text(`Time  Event`, xPosition, yPosicao+45, { align: "center" });
        doc.text(`----  -----`, xPosition, yPosicao+47.5, { align: "center" });

        // 8. Save PDF File
        doc.save(`${dadosDoJSON.reportInfo.fileName}.pdf`);

    } catch (erro) {
        console.error("Falha ao gerar o PDF:", erro);
        alert("An Error Occured! Verify the console for more details.");
    }
};

async function genMethodReport(jsonString) {
    try {

        const dadosDoJSON = JSON.parse(jsonString);
        let yPosicao = 80;
        let xPosition = 10;

        // 2. Criar a instância jsPDF
        const doc = new jspdf.jsPDF();
        
        
     
            // 3. Add the Head Information (reportInfo)
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text(dadosDoJSON.reportInfo.reportName, 10, 15);
            doc.text(dadosDoJSON.reportInfo.reoportSubName, 10, 25);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(`Report Date: ${dadosDoJSON.reportInfo.reportDate}`, 10, 35);
            doc.text(`System ID: ${dadosDoJSON.reportInfo.systemID}`, 100, 35);
            doc.text(`Database Name: ${dadosDoJSON.reportInfo.databaseName}`, 100, 40);
            doc.text(`Printed by: ${dadosDoJSON.reportInfo.printedBy}`, 100, 45);
            doc.setFontSize(8);
            doc.text(`Page ${dadosDoJSON.reportInfo.page}`, 200, 5, { align: "center" });        
            // Create a line
            doc.line(10, 50, 200, 50);
        
            // 4. Add the Parameters Information (parametersInfo)
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(`Method Name: `, 35, 55, { align: "right" });
            doc.text(`Revision: `, 35, 60, { align: "right" });
            doc.text(`Created By: `, 35, 65, { align: "right" });
            doc.text(`On: `, 35, 70, { align: "right" });
            doc.setFont("helvetica", "normal");
            doc.text(dadosDoJSON.parametersInfo.methodName, 35, 55);
            doc.text(dadosDoJSON.parametersInfo.revision.toString(), 35, 60);
            doc.text(dadosDoJSON.parametersInfo.createdBy, 35, 65);
            doc.text(dadosDoJSON.parametersInfo.createdDate, 35, 70);
        
            //Step Parameters Table
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Step Parameters", xPosition, yPosicao, { align: "left" });
            doc.text("Rinse 1", xPosition+60, yPosicao, { align: "center" });
            doc.text("Rinse 2", xPosition+80, yPosicao, { align: "center" });
            doc.text("Wash 1", xPosition+100, yPosicao, { align: "center" });
            doc.text("Wash 2", xPosition+120, yPosicao, { align: "center" });
            doc.text("Solvent #", xPosition+35, yPosicao+10, { align: "right" });
            doc.text("Time (sec)", xPosition+35, yPosicao+15, { align: "right" });
            doc.text("Velocity (RPM)", xPosition+35, yPosicao+20, { align: "right" });
        
            // Create a line
            yPosicao += 5;
            doc.line(xPosition, yPosicao, 145, yPosicao);
            yPosicao += 5;
            doc.line(50, 75, 50, 105);
            doc.line(xPosition, 105, 145, 105);
        
        // Add Parameter Table Data
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(dadosDoJSON.parametersInfo.stepParameters.solv_R1.toString(), xPosition+60, yPosicao, { align: "center" });
        doc.text(dadosDoJSON.parametersInfo.stepParameters.solv_R2.toString(), xPosition+80, yPosicao, { align: "center" });
        doc.text(dadosDoJSON.parametersInfo.stepParameters.solv_W1.toString(), xPosition+100, yPosicao, { align: "center" });
        doc.text(dadosDoJSON.parametersInfo.stepParameters.solv_W2.toString(), xPosition+120, yPosicao, { align: "center" });
        yPosicao += 5;
        doc.text(dadosDoJSON.parametersInfo.stepParameters.stepTime_R1.toString(), xPosition+60, yPosicao, { align: "center" });
        doc.text(dadosDoJSON.parametersInfo.stepParameters.stepTime_R2.toString(), xPosition+80, yPosicao, { align: "center" });
        doc.text(dadosDoJSON.parametersInfo.stepParameters.stepTime_W1.toString(), xPosition+100, yPosicao, { align: "center" });
        doc.text(dadosDoJSON.parametersInfo.stepParameters.stepTime_W2.toString(), xPosition+120, yPosicao, { align: "center" });
        yPosicao += 5;
        doc.text(dadosDoJSON.parametersInfo.stepParameters.stepRpm_R1.toString(), xPosition+60, yPosicao, { align: "center" });
        doc.text(dadosDoJSON.parametersInfo.stepParameters.stepRpm_R2.toString(), xPosition+80, yPosicao, { align: "center" });
        doc.text(dadosDoJSON.parametersInfo.stepParameters.stepRpm_W1.toString(), xPosition+100, yPosicao, { align: "center" });
        doc.text(dadosDoJSON.parametersInfo.stepParameters.stepRpm_W2.toString(), xPosition+120, yPosicao, { align: "center" });
        yPosicao += 5; 
        //---------------------
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Misc. Parameters", 150, yPosicao-25, { align: "left" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(`Soak Time: ${dadosDoJSON.parametersInfo.soakTime.toString()}`, 150, 85);
        doc.text(`Agitate 1 Time: ${dadosDoJSON.parametersInfo.agitateTime1.toString()}`, 150, 90);
        doc.text(`Agitate 2 Time: ${dadosDoJSON.parametersInfo.agitateTime2.toString()}`, 150, 95);
        doc.text(`Vials to Fill: ${dadosDoJSON.parametersInfo.vialToFill.toString()}`, 150, 100);
        doc.text(`Vial Prime Vol: ${dadosDoJSON.parametersInfo.vialPrimeVol.toString()}`, 150, 105);
        doc.text(`Vial 1 Fill Vol: ${dadosDoJSON.parametersInfo.vialFillVol1.toString()}`, 150, 110);
        doc.text(`Vial 2-4 Fill Vol: ${dadosDoJSON.parametersInfo.vialsFillVol24.toString()}`, 150, 115);
        doc.text(`Air Dry Time: ${dadosDoJSON.parametersInfo.airDryTime.toString()}`, 150, 120);

        yPosicao += 20;

        // 5. Add Volume Data Table
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Volume Data", xPosition+15, yPosicao, { align: "center" });
        doc.setFontSize(8);
        doc.text("Pump", xPosition+15, yPosicao+5, { align: "center" });
        doc.text("Stage", xPosition+35, yPosicao+5, { align: "center" });
        doc.text("Rinse 1", xPosition+47, yPosicao+5, { align: "center" });
        doc.text("Rinse 2", xPosition+67, yPosicao+5, { align: "center" });
        doc.text("Wash 1", xPosition+83, yPosicao+5, { align: "center" });
        doc.text("Wash 2", xPosition+99, yPosicao+5, { align: "center" });
        // Create a line
        yPosicao += 10;
        doc.line(xPosition, yPosicao, 200, yPosicao);
        yPosicao += 5;
        
        // 6. Add Data into the Table (volumeData)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        dadosDoJSON.volumeData.forEach(item => {
            doc.text(item.pump.toString(), xPosition+15, yPosicao, { align: "center" });
            doc.text(item.stage, xPosition+35, yPosicao, { align: "center" });
            doc.text(item.rinse1.toString(), xPosition+47, yPosicao, { align: "center" });
            doc.text(item.rinse2.toFixed(3), xPosition+67, yPosicao, { align: "center" });
            doc.text(item.wash1.toFixed(3), xPosition+83, yPosicao, { align: "center" });
            doc.text(item.wash2.toFixed(3), xPosition+99, yPosicao, { align: "center" });
            
            yPosicao += 5; // Aumenta a posição vertical para a próxima linha
        });
        // Create a line
        doc.line(xPosition, yPosicao, 200, yPosicao);

        yPosicao += 5;
        xPosition += 45;
        
        // 7. Save PDF File
        doc.save(`${dadosDoJSON.reportInfo.fileName}.pdf`);

    } catch (erro) {
        console.error("Falha ao gerar o PDF:", erro);
        alert("An Error Occured! Verify the console for more details.");
    }
};

async function genPumpCalibrationReport(calibDataArray, calibHeadArray,  reportName) {
    try {
        // 1. Acessar e ler o arquivo JSON do projeto
        
        const calibData = calibDataArray;
        const calibHead = calibHeadArray;
        let yPosicao = 80;
        let xPosition = 10;

        // 2. Criar a instância jsPDF
        const doc = new jspdf.jsPDF();
        
        const drawHeader = () => {
        // 3. Adicionar as informações do cabeçalho (reportInfo)
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text('TEGAN 1063 - Automated Sample Recovery System', 10, 15);
        doc.text(reportName, 10, 25);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Report Date: `, 10, 35);
        doc.text(`System ID: `, 100, 35);
        doc.text(`Database Name: `, 100, 40);
        doc.text(`Printed by: `, 100, 45);
        doc.setFontSize(8);
        //Creat a line
        doc.line(xPosition, 50, 200, 50);
        
        // 4. Adicionar as informações de calibração (parametersInfo)
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`Calibration #: `, 10, 55);
        doc.text(`User ID: `, 10, 60);
        doc.text(`Density: `, 10, 65);
        doc.text(`Solvent: `, 80, 55);
        doc.text(`Solvent Revision: `, 80, 60);
        doc.text(`Sys Master List Rev: `, 80, 65);
        doc.text(`Allowable Failures: `, 140, 55);
        doc.text(`Replicates: `, 140, 60);
        doc.text(`Call Interval (Days): `, 140, 65);
        doc.setFont("helvetica", "normal");
        doc.text(calibHead.CalibrationNo.toString(), 35, 55);
        doc.text(calibHead.userID, 25, 60);
        doc.text(calibHead.density.toFixed(4), 25, 65);
        doc.text(calibHead.solventNo, 95, 55);
        doc.text(calibHead.solventRevision, 110, 60);
        doc.text(calibHead.sysRevisionNo.toString(), 115, 65);
        doc.text(calibHead.allowableFail, 175, 55);
        doc.text(calibHead.replicates, 160, 60);
        doc.text(calibHead.callInterval, 175, 65);

        // 5. Adicionar o cabeçalho da tabela
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
        };

        drawHeader();

        // 6. Adicionar os dados da tabela (calibrationData)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);

        // Filter out empty or invalid items before the loop
        const filteredData = calibData.filter(item => 
            item.dateTime?.trim() !== "" &&
            item.pumpNo?.trim() !== "" &&
            item.step?.trim() !== "" &&
            item.tareWt?.trim() !== "" &&
            item.grossWt?.trim() !== "" &&
            item.netVolume?.trim() !== "" &&
            item.netWt?.trim() !== "" &&
            item.targetVolume?.trim() !== "" &&
            item.differencePercent?.trim() !== "" &&
            item.criteria?.trim() !== "" &&
            item.pumpRevs?.trim() !== ""
        );

        filteredData.forEach(item => {
            if (yPosicao > 280) { // adjust for your margin
                doc.addPage();
                drawHeader();
            }
            doc.text(item.dateTime, xPosition, yPosicao);
            doc.text(item.pumpNo, xPosition+34, yPosicao);
            doc.text(item.step, xPosition+42, yPosicao);
            doc.text(item.tareWt, xPosition+67, yPosicao, { align: "center" });
            doc.text(item.grossWt, xPosition+83, yPosicao, { align: "center" });
            doc.text(item.netWt, xPosition+99, yPosicao, { align: "center" });
            doc.text(item.netVolume, xPosition+115, yPosicao, { align: "center" });
            doc.text(item.targetVolume, xPosition+131, yPosicao, { align: "center" });
            doc.text(item.differencePercent, xPosition+147, yPosicao, { align: "center" });
            doc.text(item.criteria, xPosition+163, yPosicao, { align: "center" });
            doc.text(item.pumpRevs, xPosition+179, yPosicao, { align: "center" });
            
            yPosicao += 5; // Aumenta a posição vertical para a próxima linha
        });

        // 7. add page numbers after content
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Page ${i} of ${totalPages}`, 200, 5, { align: "center" });
        }
  
        // 8. Salvar o arquivo PDF
        doc.save(`${reportName}.pdf`);

    } catch (erro) {
        console.error("Falha ao gerar o PDF:", erro);
        alert("An Error Occured! Verify the console for more details.");
    }
};

async function genCurrentUserList(userDataArray, reportName) {
    try {

        const userData = userDataArray;
        let yPosicao = 63;
        let xPosition = 10;

        // 2. Criar a instância jsPDF
        const doc = new jspdf.jsPDF();
        
        // 3. header function
        const drawHeader = () => {
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text(`TEGAN 1063 - Automated Sample Recovery System`, 10, 15);
            doc.text(reportName, 10, 25);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(`Report Date: `, 10, 35);
            doc.text(`System ID: ---`, 10, 40);
            doc.text(`Database Name: ---`, 100, 35);
            doc.text(`Printed by: `, 100, 40);
            // line
            doc.line(10, 50, 200, 50);
            // table header
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(`User ID`, 10, 55);
            doc.text(`Access Level`, 70, 55);
            doc.text(`Add Date`, 110, 55);
            doc.text(`Entered By`, 160, 55);
            doc.line(10, 57.5, 200, 57.5);
            // reset font
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            yPosicao = 63;
        };
        
        drawHeader();
                        
        // 4. Add Data into the Table
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);

        // Filter out empty or invalid items before the loop
        const filteredData = userData.filter(item => 
            item.userID?.trim() !== "" &&
            item.acessLevel?.trim() !== "" &&
            item.addDate?.trim() !== "" &&
            item.enteredBy?.trim() !== ""
        );

        filteredData.forEach(item => {
            if (yPosicao > 280) { // adjust for your margin
                doc.addPage();
                drawHeader();
            }
            doc.text(item.userID, xPosition, yPosicao);
            doc.text(item.acessLevel, xPosition+60, yPosicao);
            doc.text(item.addDate, xPosition+100, yPosicao);
            doc.text(item.enteredBy, xPosition+150, yPosicao);
            
            yPosicao += 3; // Aumenta a posição vertical para a próxima linha
        });

        // 5. add page numbers after content
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Page ${i} of ${totalPages}`, 200, 5, { align: "center" });
        }

        // 6. Save PDF File
        doc.save(`${reportName}.pdf`);

    } catch (erro) {
        console.error("Falha ao gerar o PDF:", erro);
        alert("An Error Occured! Verify the console for more details.");
    }
};

async function genUserHistoryReport(userDataArray, reportName) {
    try {

        const userData = userDataArray;
        let yPosicao = 63;
        let xPosition = 10;

        // 2. Criar a instância jsPDF
        const doc = new jspdf.jsPDF();
        
        // 3. header function
        const drawHeader = () => {
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text('TEGAN 1063 - Automated Sample Recovery System', 10, 15);
            doc.text(reportName, 10, 25);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(`Report Date: `, 10, 35);
            doc.text(`System ID: `, 10, 40);
            doc.text(`Database Name: `, 100, 35);
            doc.text(`Printed by: `, 100, 40);
            // line
            doc.line(10, 50, 200, 50);
            // table header
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(`User ID`, 10, 55);
            doc.text(`Access Level`, 60, 55);
            doc.text(`Transaction Type`, 90, 55);
            doc.text(`Transaction Date`, 130, 55);
            doc.text(`Transacted By`, 170, 55);
            doc.line(10, 57.5, 200, 57.5);
            // reset font
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            yPosicao = 63;
        };
        
        drawHeader();

        // 4. Add Data into the Table
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);

        // Filter out empty or invalid items before the loop
        const filteredData = userData.filter(item => 
            item.userID?.trim() !== "" &&
            item.acessLevel?.trim() !== "" &&
            item.addDate?.trim() !== "" &&
            item.enteredBy?.trim() !== ""
        );

        filteredData.listOfUsers.forEach(item => {
            if (yPosicao > 280) { // adjust for your margin
                doc.addPage();
                drawHeader();
            }
            doc.text(item.userID, xPosition, yPosicao);
            doc.text(item.acessLevel, xPosition+50, yPosicao);
            doc.text(item.transactionType, xPosition+80, yPosicao);
            doc.text(item.transactionDate, xPosition+120, yPosicao);
            doc.text(item.transactedBy, xPosition+160, yPosicao);
            
            yPosicao += 3; // Aumenta a posição vertical para a próxima linha
        });
        
        // 5. add page numbers after content
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Page ${i} of ${totalPages}`, 200, 5, { align: "center" });
        }

        // 6. Save PDF File
        doc.save(`${reportName}.pdf`);

    } catch (erro) {
        console.error("Falha ao gerar o PDF:", erro);
        alert("An Error Occured! Verify the console for more details.");
    }
};
