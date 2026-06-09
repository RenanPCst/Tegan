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
function formatNumber(value, decimals) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
        return num.toFixed(decimals);
    }
    return value;
}

function timeToSecondsString(value) {
    if (value === null || value === undefined || value === '') return '';

    if (typeof value === 'number') {
        return String(Math.round(value));
    }

    const s = String(value).trim().toUpperCase();

    const isoMatch = s.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/);
    if (isoMatch) {
        const hours = parseFloat(isoMatch[1] || '0');
        const minutes = parseFloat(isoMatch[2] || '0');
        const seconds = parseFloat(isoMatch[3] || '0');
        return String(Math.round(hours * 3600 + minutes * 60 + seconds));
    }

    const matchMs = s.match(/^(\d+(?:\.\d+)?)MS$/);
    if (matchMs) {
        return String(Math.round(parseFloat(matchMs[1]) / 1000));
    }

    const matchS = s.match(/^(\d+(?:\.\d+)?)S$/);
    if (matchS) {
        return String(Math.round(parseFloat(matchS[1])));
    }

    return s;
}

function readSymbolValue(symbol) {
    return new Promise((resolve, reject) => {
        TcHmi.Symbol.readEx2('%s%' + symbol + '%/s%', function (data) {
            if (data.error === TcHmi.Errors.NONE) {
                resolve(data.value);
            } else {
                reject(data.error);
            }
        });
    });
}

function formatReportDate(date = new Date()) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dd = String(date.getDate()).padStart(2, '0');
    const mmm = months[date.getMonth()];
    const yyyy = String(date.getFullYear());
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');

    return `${dd}-${mmm}-${yyyy} ${hh}:${mm}:${ss}`;
}

async function getReportHeaderInfo() {
    let systemId = '';
    let databaseName = '';
    let printedBy = '';

    try {
        systemId = await readSymbolValue('PLC1.GVL_Constant.sSystemID') || '';
    } catch (e) {
        console.warn('Could not read sSystemID:', e);
    }

    try {
        databaseName = await readSymbolValue('PLC1.GVL_Constant.sDatabaseName') || '';
    } catch (e) {
        console.warn('Could not read sDatabaseName:', e);
    }

    try {
        if (TcHmi.Server && typeof TcHmi.Server.getCurrentUser === 'function') {
            const currentUser = TcHmi.Server.getCurrentUser();
            if (currentUser) {
                if (typeof currentUser === 'string') {
                    printedBy = currentUser;
                } else if (typeof currentUser === 'object') {
                    printedBy = currentUser.userName || currentUser.name || currentUser.user || '';
                }
            }
        }
    } catch (e) {
        console.warn('Could not read current user:', e);
    }

    return {
        reportDate: formatReportDate(new Date()),
        systemId: systemId,
        databaseName: databaseName,
        printedBy: printedBy
    };
}


async function genPostRunReport(runDataArray, methodDataArray, volumeDataArray, reportName) {
    try {
        const headerInfo = await getReportHeaderInfo();

        const runData = runDataArray;
        const methodData = methodDataArray;
        const volumeData = volumeDataArray;
        let yPosicao = 80;
        let xPosition = 10;

        // 2. Criar a instância jsPDF
        const doc = new jspdf.jsPDF();

        // Define a fonte padrão para o texto
        doc.setFont("helvetica", "normal");

        // 3. Add the Head Information (reportInfo)
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(`TEGAN 1063 - Automated Sample Recovery System`, 10, 15);
        doc.text(reportName, 10, 25);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Report Date: ${headerInfo.reportDate}`, 10, 35);
        doc.text(`System ID: ${headerInfo.systemId}`, 100, 35);
        doc.text(`Database Name: ${headerInfo.databaseName}`, 100, 40);
        doc.text(`Printed by: ${headerInfo.printedBy}`, 100, 45);
        doc.setFontSize(8);
        doc.text(`Page 01/01`, 200, 5, { align: "center" });
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
        doc.text(methodData.methodName, 35, 55);
        doc.text(methodData.methodRevision, 35, 60);
        doc.text(methodData.methodCreatedBy, 35, 65);
        doc.text(methodData.methodCreatedOn, 35, 70);

        //Step Parameters Table
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Step Parameters", xPosition, yPosicao, { align: "left" });
        doc.text("Rinse 1", xPosition + 60, yPosicao, { align: "center" });
        doc.text("Rinse 2", xPosition + 80, yPosicao, { align: "center" });
        doc.text("Wash 1", xPosition + 100, yPosicao, { align: "center" });
        doc.text("Wash 2", xPosition + 120, yPosicao, { align: "center" });
        doc.text("Solvent #", xPosition + 35, yPosicao + 10, { align: "right" });
        doc.text("Time (sec)", xPosition + 35, yPosicao + 15, { align: "right" });
        doc.text("Velocity (RPM)", xPosition + 35, yPosicao + 20, { align: "right" });

        // Create a line
        yPosicao += 5;
        doc.line(xPosition, yPosicao, 145, yPosicao);
        yPosicao += 5;
        doc.line(50, 75, 50, 105);
        doc.line(xPosition, 105, 145, 105);

        // Add Parameter Table Data
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(methodData.solvent_R1, xPosition + 60, yPosicao, { align: "center" });
        doc.text(methodData.solvent_R2, xPosition + 80, yPosicao, { align: "center" });
        doc.text(methodData.solvent_W1, xPosition + 100, yPosicao, { align: "center" });
        doc.text(methodData.solvent_W2, xPosition + 120, yPosicao, { align: "center" });
        yPosicao += 5;
        doc.text(methodData.time_R1, xPosition + 60, yPosicao, { align: "center" });
        doc.text(methodData.time_R2, xPosition + 80, yPosicao, { align: "center" });
        doc.text(methodData.time_W1, xPosition + 100, yPosicao, { align: "center" });
        doc.text(methodData.time_W2, xPosition + 120, yPosicao, { align: "center" });
        yPosicao += 5;
        doc.text(methodData.velocity_R1, xPosition + 60, yPosicao, { align: "center" });
        doc.text(methodData.velocity_R2, xPosition + 80, yPosicao, { align: "center" });
        doc.text(methodData.velocity_W1, xPosition + 100, yPosicao, { align: "center" });
        doc.text(methodData.velocity_W2, xPosition + 120, yPosicao, { align: "center" });
        yPosicao += 5;
        //---------------------
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Misc. Parameters", 170, yPosicao - 25, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Soak Time: `, 180, 85, { align: "right" });
        doc.text(` ${methodData.soakTime} sec`, 180, 85, { align: "left" });
        doc.text(`Agitate 1 Time: `, 180, 90, { align: "right" });
        doc.text(` ${methodData.agitate_1_Time} sec`, 180, 90, { align: "left" });
        doc.text(`Agitate 2 Time: `, 180, 95, { align: "right" });
        doc.text(` ${methodData.agitate_2_Time} sec`, 180, 95, { align: "left" });
        doc.text(`Vials to Fill: `, 180, 100, { align: "right" });
        doc.text(` ${methodData.vialsToFill}`, 180, 100, { align: "left" });
        doc.text(`Vial Prime Vol: `, 180, 105, { align: "right" });
        doc.text(` ${methodData.vialPrimeVol} ml`, 180, 105, { align: "left" });
        doc.text(`Vial 1 Fill Vol: `, 180, 110, { align: "right" });
        doc.text(` ${methodData.vial_1_FillVol} ml`, 180, 110, { align: "left" });
        doc.text(`Vial 2-4 Fill Vol: `, 180, 115, { align: "right" });
        doc.text(` ${methodData.vial_2_4_FillVol} ml`, 180, 115, { align: "left" });
        doc.text(`Air Dry Time: `, 180, 120, { align: "right" });
        doc.text(` ${methodData.airDryTime} sec`, 180, 120, { align: "left" });

        yPosicao += 20;

        // 5. Add Volume Data Table
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Volume Data", xPosition + 15, yPosicao, { align: "center" });
        doc.setFontSize(10);
        doc.text("Pump", xPosition + 15, yPosicao + 5, { align: "center" });
        doc.text("Stage", xPosition + 35, yPosicao + 5, { align: "center" });
        doc.text("Rinse 1", xPosition + 47, yPosicao + 5, { align: "center" });
        doc.text("Rinse 2", xPosition + 67, yPosicao + 5, { align: "center" });
        doc.text("Wash 1", xPosition + 83, yPosicao + 5, { align: "center" });
        doc.text("Wash 2", xPosition + 99, yPosicao + 5, { align: "center" });
        // Create a line
        yPosicao += 10;
        doc.line(xPosition, yPosicao, 200, yPosicao);
        yPosicao += 5;

        // 6. Add Data into the Table (volumeData)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);

        // Filter out empty or invalid items before the loop
        const filteredData = volumeData.filter(item =>
            item.pump ?.trim() !== "" &&
                item.stage ?.trim() !== "" &&
                    item.rinse1 ?.trim() !== "" &&
                        item.rinse2 ?.trim() !== "" &&
                            item.wash1 ?.trim() !== "" &&
                                item.wash2 ?.trim() !== ""
        );

        filteredData.forEach(item => {
            doc.text(item.pump, xPosition + 15, yPosicao, { align: "center" });
            doc.text(item.stage, xPosition + 35, yPosicao, { align: "center" });
            doc.text(item.rinse1, xPosition + 47, yPosicao, { align: "center" });
            doc.text(item.rinse2, xPosition + 67, yPosicao, { align: "center" });
            doc.text(item.wash1, xPosition + 83, yPosicao, { align: "center" });
            doc.text(item.wash2, xPosition + 99, yPosicao, { align: "center" });

            yPosicao += 5; // Aumenta a posição vertical para a próxima linha
        });
        // Create a line
        doc.line(xPosition, yPosicao, 200, yPosicao);

        yPosicao += 5;
        xPosition += 45;

        // 7. Add Run Events data
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Run Events", xPosition, yPosicao, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        yPosicao += 2.5;
        doc.text(`Analyst:  `, xPosition, yPosicao + 3, { align: "right" });
        doc.text(runData.analyst, xPosition, yPosicao + 3, { align: "left" });
        doc.text(`Run No:  `, xPosition, yPosicao + 6, { align: "right" });
        doc.text(runData.runNo.toString(), xPosition, yPosicao + 6, { align: "left" });
        doc.text(`Calibration No:  `, xPosition, yPosicao + 9, { align: "right" });
        doc.text(runData.CalibrationNo.toString(), xPosition, yPosicao + 9, { align: "left" });
        doc.text(`Comment:  `, xPosition, yPosicao + 12, { align: "right" });
        doc.text(runData.comment, xPosition, yPosicao + 12, { align: "left" });
        doc.text(`--------------   `, xPosition, yPosicao + 15, { align: "right" });
        doc.text(`Software Version:  `, xPosition, yPosicao + 18, { align: "right" });
        doc.text(runData.softwareVersion, xPosition, yPosicao + 18, { align: "left" });
        doc.text(`System Master Revision:  `, xPosition, yPosicao + 21, { align: "right" });
        doc.text(runData.sysMasterRevision, xPosition, yPosicao + 21, { align: "left" });
        doc.text(`Meter Velocity:  `, xPosition, yPosicao + 24, { align: "right" });
        doc.text(runData.meterVelocity, xPosition, yPosicao + 24, { align: "left" });
        doc.text(`Run Velocity:  `, xPosition, yPosicao + 27, { align: "right" });
        doc.text(runData.runVelocity, xPosition, yPosicao + 27, { align: "left" });
        doc.text(`Empty Tubes Factor:  `, xPosition, yPosicao + 30, { align: "right" });
        doc.text(runData.emptyTubesFactor, xPosition, yPosicao + 30, { align: "left" });
        doc.text(`Fill Tubes Factor:  `, xPosition, yPosicao + 33, { align: "right" });
        doc.text(runData.fillTubesFactor, xPosition, yPosicao + 33, { align: "left" });
        doc.text(`--------------   `, xPosition, yPosicao + 36, { align: "right" });
        doc.text(`Solvent#1 Name & Revision:  `, xPosition, yPosicao + 39, { align: "right" });
        doc.text(runData.solvent1NameRevision, xPosition, yPosicao + 39, { align: "left" });
        doc.text(`Solvent#2 Name & Revision:  `, xPosition, yPosicao + 42, { align: "right" });
        doc.text(runData.solvent2NameRevision, xPosition, yPosicao + 42, { align: "left" });
        doc.text(`Solvent#3 Name & Revision:  `, xPosition, yPosicao + 45, { align: "right" });
        doc.text(runData.solvent3NameRevision, xPosition, yPosicao + 45, { align: "left" });
        doc.text(`Solvent#4 Name & Revision:  `, xPosition, yPosicao + 48, { align: "right" });
        doc.text(runData.solvent4NameRevision, xPosition, yPosicao + 48, { align: "left" });
        doc.text(`Time  Event`, xPosition, yPosicao + 54, { align: "center" });
        doc.text(`----  -----`, xPosition, yPosicao + 57, { align: "center" });
        doc.text(runData.timeEventStarted, xPosition, yPosicao + 60, { align: "right" });
        doc.text(runData.timeEventCompleted, xPosition, yPosicao + 63, { align: "right" });
        doc.text(`Started`, xPosition, yPosicao + 60, { align: "left" });
        doc.text(`Completed`, xPosition, yPosicao + 63, { align: "left" });

        // 8. Save PDF File
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const container = document.createElement('div');
        container.style.width = "100%";
        container.style.height = "100vh";
        container.style.display = "flex";
        container.style.flexDirection = "column";

        const backButton = document.createElement('button');
        backButton.textContent = "← Back";
        backButton.style = `
      background: #1976d2;
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
      align-self: flex-start;
    `;
        backButton.onclick = () => {
            window.location.reload(); // volta à tela inicial
        };

        const iframe = document.createElement('iframe');
        iframe.src = pdfUrl;
        iframe.style.width = "100%";
        iframe.style.flex = "1";
        iframe.style.border = "none";

        container.appendChild(backButton);
        container.appendChild(iframe);
        document.body.innerHTML = "";
        document.body.appendChild(container);
        //doc.save(`${dadosDoJSON.reportInfo.fileName}.pdf`);

    } catch (erro) {
        console.error("Falha ao gerar o PDF:", erro);
        alert("An Error Occured! Verify the console for more details.");
    }
};

async function genMethodReport(methodDataArray, volumeDataArray, reportName) {
    try {
        const headerInfo = await getReportHeaderInfo();

        const methodData = methodDataArray;
        const volumeData = volumeDataArray;
        let yPosicao = 80;
        let xPosition = 10;

        // 2. Criar a instância jsPDF
        const doc = new jspdf.jsPDF();

        // 3. Add the Head Information (reportInfo)
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(`TEGAN 1063 - Automated Sample Recovery System`, 10, 15);
        doc.text(reportName, 10, 25);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Report Date: ${headerInfo.reportDate}`, 10, 35);
        doc.text(`System ID: ${headerInfo.systemId}`, 100, 35);
        doc.text(`Database Name: ${headerInfo.databaseName}`, 100, 40);
        doc.text(`Printed by: ${headerInfo.printedBy}`, 100, 45);
        doc.setFontSize(8);
        doc.text(`Page `, 200, 5, { align: "center" });
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
        doc.text(methodData.methodName, 35, 55);
        doc.text(methodData.methodRevision, 35, 60);
        doc.text(methodData.methodCreatedBy, 35, 65);
        doc.text(methodData.methodCreatedOn, 35, 70);

        //Step Parameters Table
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Step Parameters", xPosition, yPosicao, { align: "left" });
        doc.text("Rinse 1", xPosition + 60, yPosicao, { align: "center" });
        doc.text("Rinse 2", xPosition + 80, yPosicao, { align: "center" });
        doc.text("Wash 1", xPosition + 100, yPosicao, { align: "center" });
        doc.text("Wash 2", xPosition + 120, yPosicao, { align: "center" });
        doc.text("Solvent #", xPosition + 35, yPosicao + 10, { align: "right" });
        doc.text("Time (sec)", xPosition + 35, yPosicao + 15, { align: "right" });
        doc.text("Velocity (RPM)", xPosition + 35, yPosicao + 20, { align: "right" });

        // Create a line
        yPosicao += 5;
        doc.line(xPosition, yPosicao, 145, yPosicao);
        yPosicao += 5;
        doc.line(50, 75, 50, 105);
        doc.line(xPosition, 105, 145, 105);

        // Add Parameter Table Data
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(methodData.solvent_R1, xPosition + 60, yPosicao, { align: "center" });
        doc.text(methodData.solvent_R2, xPosition + 80, yPosicao, { align: "center" });
        doc.text(methodData.solvent_W1, xPosition + 100, yPosicao, { align: "center" });
        doc.text(methodData.solvent_W2, xPosition + 120, yPosicao, { align: "center" });
        yPosicao += 5;
        doc.text(timeToSecondsString(methodData.time_R1), xPosition + 60, yPosicao, { align: "center" });
        doc.text(timeToSecondsString(methodData.time_R2), xPosition + 80, yPosicao, { align: "center" });
        doc.text(timeToSecondsString(methodData.time_W1), xPosition + 100, yPosicao, { align: "center" });
        doc.text(timeToSecondsString(methodData.time_W2), xPosition + 120, yPosicao, { align: "center" });
        yPosicao += 5;
        doc.text(methodData.velocity_R1, xPosition + 60, yPosicao, { align: "center" });
        doc.text(methodData.velocity_R2, xPosition + 80, yPosicao, { align: "center" });
        doc.text(methodData.velocity_W1, xPosition + 100, yPosicao, { align: "center" });
        doc.text(methodData.velocity_W2, xPosition + 120, yPosicao, { align: "center" });
        yPosicao += 5;
        //---------------------
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Misc. Parameters", 170, yPosicao - 25, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Soak Time: `, 180, 85, { align: "right" });
        doc.text(` ${timeToSecondsString(methodData.soakTime)} sec`, 180, 85, { align: "left" });
        doc.text(`Agitate 1 Time: `, 180, 90, { align: "right" });
        doc.text(` ${timeToSecondsString(methodData.agitate_1_Time)} sec`, 180, 90, { align: "left" });
        doc.text(`Agitate 2 Time: `, 180, 95, { align: "right" });
        doc.text(` ${timeToSecondsString(methodData.agitate_2_Time)} sec`, 180, 95, { align: "left" });
        doc.text(`Vials to Fill: `, 180, 100, { align: "right" });
        doc.text(` ${methodData.vialsToFill}`, 180, 100, { align: "left" });
        doc.text(`Vial Prime Vol: `, 180, 105, { align: "right" });
        doc.text(` ${methodData.vialPrimeVol} ml`, 180, 105, { align: "left" });
        doc.text(`Vial 1 Fill Vol: `, 180, 110, { align: "right" });
        doc.text(` ${methodData.vial_1_FillVol} ml`, 180, 110, { align: "left" });
        doc.text(`Vial 2-4 Fill Vol: `, 180, 115, { align: "right" });
        doc.text(` ${methodData.vial_2_4_FillVol} ml`, 180, 115, { align: "left" });
        doc.text(`Air Dry Time: `, 180, 120, { align: "right" });
        doc.text(` ${timeToSecondsString(methodData.airDryTime)} sec`, 180, 120, { align: "left" });

        yPosicao += 20;

        // 5. Add Volume Data Table
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Volume Data", xPosition + 15, yPosicao, { align: "center" });
        doc.setFontSize(8);
        doc.text("Pump", xPosition + 15, yPosicao + 5, { align: "center" });
        doc.text("Stage", xPosition + 35, yPosicao + 5, { align: "center" });
        doc.text("Rinse 1", xPosition + 47, yPosicao + 5, { align: "center" });
        doc.text("Rinse 2", xPosition + 67, yPosicao + 5, { align: "center" });
        doc.text("Wash 1", xPosition + 83, yPosicao + 5, { align: "center" });
        doc.text("Wash 2", xPosition + 99, yPosicao + 5, { align: "center" });
        // Create a line
        yPosicao += 10;
        doc.line(xPosition, yPosicao, 200, yPosicao);
        yPosicao += 5;

        // 6. Add Data into the Table (volumeData)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);

        // Filter out empty or invalid items before the loop
        const filteredData = volumeData.filter(item =>
            item.pump ?.trim() !== "" &&
                item.stage ?.trim() !== "" &&
                    item.rinse1 ?.trim() !== "" &&
                        item.rinse2 ?.trim() !== "" &&
                            item.wash1 ?.trim() !== "" &&
                                item.wash2 ?.trim() !== ""
        );

        filteredData.forEach(item => {
            doc.text(item.pump, xPosition + 15, yPosicao, { align: "center" });
            doc.text(item.stage, xPosition + 35, yPosicao, { align: "center" });
            doc.text(item.rinse1, xPosition + 47, yPosicao, { align: "center" });
            doc.text(item.rinse2, xPosition + 67, yPosicao, { align: "center" });
            doc.text(item.wash1, xPosition + 83, yPosicao, { align: "center" });
            doc.text(item.wash2, xPosition + 99, yPosicao, { align: "center" });

            yPosicao += 5; // Aumenta a posição vertical para a próxima linha
        });
        // Create a line
        doc.line(xPosition, yPosicao, 200, yPosicao);

        yPosicao += 5;
        xPosition += 45;

        // 7. Save PDF File
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const container = document.createElement('div');
        container.style.width = "100%";
        container.style.height = "100vh";
        container.style.display = "flex";
        container.style.flexDirection = "column";

        const backButton = document.createElement('button');
        backButton.textContent = "← Back";
        backButton.style = `
      background: #1976d2;
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
      align-self: flex-start;
    `;
        backButton.onclick = () => {
            window.location.reload(); // volta à tela inicial
        };

        const iframe = document.createElement('iframe');
        iframe.src = pdfUrl;
        iframe.style.width = "100%";
        iframe.style.flex = "1";
        iframe.style.border = "none";

        container.appendChild(backButton);
        container.appendChild(iframe);
        document.body.innerHTML = "";
        document.body.appendChild(container);
        //doc.save(`${reportName}.pdf`);

    } catch (erro) {
        console.error("Falha ao gerar o PDF:", erro);
        alert("An Error Occured! Verify the console for more details.");
    }
};

async function genCompleteMethodReportOld(allRevisions, reportName) {
    try {
        const doc = new jspdf.jsPDF();

        const validMethods = allRevisions.filter(m =>
            m.methodName && m.methodName.trim() !== ""
        );

        validMethods.forEach((methodData, index) => {

            if (index > 0) doc.addPage();

            let x = 10;
            let y = 80;

            // Cabeçalho
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text("TEGAN 1063 - Automated Sample Recovery System", 10, 15);
            doc.text(`${reportName} - Revision ${methodData.methodRevision}`, 10, 25);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 10, 35);
            doc.text(`System ID: ${methodData.methodID}`, 100, 35);
            doc.text(`Printed by: operator`, 100, 45);

            doc.line(10, 50, 200, 50);

            // Dados do método
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Method Name:", 35, 55, { align: "right" });
            doc.text("Revision:", 35, 60, { align: "right" });
            doc.text("Created By:", 35, 65, { align: "right" });
            doc.text("On:", 35, 70, { align: "right" });

            doc.setFont("helvetica", "normal");
            doc.text(methodData.methodName, 35, 55);
            doc.text(methodData.methodRevision, 35, 60);
            doc.text(methodData.methodCreatedBy, 35, 65);
            doc.text(methodData.methodCreatedOn, 35, 70);

            // Step Parameters
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.text("Step Parameters", x, y);

            doc.text("Rinse 1", x + 60, y);
            doc.text("Rinse 2", x + 80, y);
            doc.text("Wash 1", x + 100, y);
            doc.text("Wash 2", x + 120, y);

            doc.setFontSize(8);
            doc.text("Solvent #", x + 35, y + 10, { align: "right" });
            doc.text("Time (sec)", x + 35, y + 15, { align: "right" });
            doc.text("Velocity (RPM)", x + 35, y + 20, { align: "right" });

            y += 15;
            doc.line(x, y, 145, y);
            y += 5;

            doc.setFont("helvetica", "normal");

            // Solvents
            doc.text(methodData.solvent_R1, x + 60, y);
            doc.text(methodData.solvent_R2, x + 80, y);
            doc.text(methodData.solvent_W1, x + 100, y);
            doc.text(methodData.solvent_W2, x + 120, y);

            y += 5;

            // Times
            doc.text(methodData.time_R1, x + 60, y);
            doc.text(methodData.time_R2, x + 80, y);
            doc.text(methodData.time_W1, x + 100, y);
            doc.text(methodData.time_W2, x + 120, y);

            y += 5;

            // Velocity
            doc.text(methodData.velocity_R1, x + 60, y);
            doc.text(methodData.velocity_R2, x + 80, y);
            doc.text(methodData.velocity_W1, x + 100, y);
            doc.text(methodData.velocity_W2, x + 120, y);

            // Misc
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text("Misc. Parameters", 170, yPosicao - 25, { align: "center" });
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(`Soak Time: `, 180, 85, { align: "right" });
            doc.text(` ${methodData.soakTime} sec`, 180, 85, { align: "left" });
            doc.text(`Agitate 1 Time: `, 180, 90, { align: "right" });
            doc.text(` ${methodData.agitate_1_Time} sec`, 180, 90, { align: "left" });
            doc.text(`Agitate 2 Time: `, 180, 95, { align: "right" });
            doc.text(` ${methodData.agitate_2_Time} sec`, 180, 95, { align: "left" });
            doc.text(`Vials to Fill: `, 180, 100, { align: "right" });
            doc.text(` ${methodData.vialsToFill}`, 180, 100, { align: "left" });
            doc.text(`Vial Prime Vol: `, 180, 105, { align: "right" });
            doc.text(` ${methodData.vialPrimeVol} ml`, 180, 105, { align: "left" });
            doc.text(`Vial 1 Fill Vol: `, 180, 110, { align: "right" });
            doc.text(` ${methodData.vial_1_FillVol} ml`, 180, 110, { align: "left" });
            doc.text(`Vial 2-4 Fill Vol: `, 180, 115, { align: "right" });
            doc.text(` ${methodData.vial_2_4_FillVol} ml`, 180, 115, { align: "left" });
            doc.text(`Air Dry Time: `, 180, 120, { align: "right" });
            doc.text(` ${methodData.airDryTime} sec`, 180, 120, { align: "left" });

            // Volume Data
            y += 25;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text("Volume Data", x + 15, y);

            y += 5;
            doc.setFontSize(8);

            doc.text("Pump", x + 15, y);
            doc.text("Stage", x + 35, y);
            doc.text("Rinse 1", x + 47, y);
            doc.text("Rinse 2", x + 67, y);
            doc.text("Wash 1", x + 83, y);
            doc.text("Wash 2", x + 99, y);

            y += 5;
            doc.line(x, y, 200, y);
            y += 5;

            methodData.volumeData.forEach(v => {
                if (!v.pump.trim()) return;

                doc.text(v.pump, x + 15, y);
                doc.text(v.stage, x + 35, y);
                doc.text(v.rinse1, x + 47, y);
                doc.text(v.rinse2, x + 67, y);
                doc.text(v.wash1, x + 83, y);
                doc.text(v.wash2, x + 99, y);

                y += 5;
            });

            doc.line(x, y, 200, y);
        });

        // Numeração das páginas
        const totalPages = doc.internal.getNumberOfPages();
        for (let p = 1; p <= totalPages; p++) {
            doc.setPage(p);
            doc.setFontSize(8);
            doc.text(`Page ${p} of ${totalPages}`, 200, 5, { align: "center" });
        }

        // Exibir PDF
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const container = document.createElement('div');
        container.style.width = "100%";
        container.style.height = "100vh";
        container.style.display = "flex";
        container.style.flexDirection = "column";

        const backButton = document.createElement('button');
        backButton.textContent = "← Back";
        backButton.style = `
      background: #1976d2;
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
      align-self: flex-start;
    `;
        backButton.onclick = () => {
            window.location.reload(); // volta à tela inicial
        };

        const iframe = document.createElement('iframe');
        iframe.src = pdfUrl;
        iframe.style.width = "100%";
        iframe.style.flex = "1";
        iframe.style.border = "none";

        container.appendChild(backButton);
        container.appendChild(iframe);
        document.body.innerHTML = "";
        document.body.appendChild(container);

    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
    }
};




async function genPumpCalibrationReport(calibDataArray, calibHeadArray, reportName) {
    try {
        const headerInfo = await getReportHeaderInfo();

        // 1. Acessar e ler o arquivo JSON do projeto
        const calibData = calibDataArray;
        const calibHead = calibHeadArray;
        let xPosition = 10;
        let yPosicao = 80;

        // 2. Criar a instância jsPDF
        const doc = new jspdf.jsPDF();

        const drawHeader = (data = calibHeadArray) => {

            yPosicao = 80;

            // 3. Adicionar as informações do cabeçalho (reportInfo)
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text('TEGAN 1063 - Automated Sample Recovery System', 10, 15);
            doc.text(reportName, 10, 25);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(`Report Date: ${headerInfo.reportDate}`, 10, 35);
            doc.text(`System ID: ${headerInfo.systemId}`, 100, 35);
            doc.text(`Database Name: ${headerInfo.databaseName}`, 100, 40);
            doc.text(`Printed by: ${headerInfo.printedBy}`, 100, 45);
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
            doc.text(data.CalibrationNo.toString(), 35, 55);
            doc.text(data.userID, 25, 60);
            doc.text(data.density, 25, 65);
            doc.text(data.solventNo, 95, 55);
            doc.text(data.solventRevision, 110, 60);
            doc.text(data.sysRevisionNo.toString(), 115, 65);
            doc.text(data.allowableFail, 175, 55);
            doc.text(data.replicates, 160, 60);
            doc.text(data.callInterval, 175, 65);

            // 5. Adicionar o cabeçalho da tabela
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.text("Date/Time", xPosition + 15, yPosicao, { align: "center" });
            doc.text("Pump\n#", xPosition + 35, yPosicao, { align: "center" });
            doc.text("Step", xPosition + 47, yPosicao, { align: "center" });
            doc.text("Tare Wt\n(g)", xPosition + 67, yPosicao, { align: "center" });
            doc.text("Gross Wt\n(g)", xPosition + 83, yPosicao, { align: "center" });
            doc.text("Net Wt\n(g)", xPosition + 99, yPosicao, { align: "center" });
            doc.text("Net\nVolume", xPosition + 115, yPosicao, { align: "center" });
            doc.text("Target\nVolume", xPosition + 131, yPosicao, { align: "center" });
            doc.text("Difference\n%", xPosition + 147, yPosicao, { align: "center" });
            doc.text("Criteria", xPosition + 163, yPosicao, { align: "center" });
            doc.text("Pump\nRevs", xPosition + 179, yPosicao, { align: "center" });

            // Adiciona uma linha para separar o cabeçalho dos dados
            yPosicao += 5;
            doc.line(xPosition, yPosicao, 200, yPosicao);
            yPosicao += 5;

            // Resets the font for writing the data
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);

        };

        drawHeader();

        // 6. Adicionar os dados da tabela (calibrationData)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);

        // Filter out empty or invalid items before the loop
        const filteredData = calibData.filter(item =>
            item.dateTime ?.trim() !== "" &&
                item.pumpNo ?.trim() !== "" &&
                    item.step ?.trim() !== "" &&
                        item.tareWt ?.trim() !== "" &&
                            item.grossWt ?.trim() !== "" &&
                                item.netVolume ?.trim() !== "" &&
                                    item.netWt ?.trim() !== "" &&
                                        item.targetVolume ?.trim() !== "" &&
                                            item.differencePercent ?.trim() !== "" &&
                                                item.criteria ?.trim() !== "" &&
                                                    item.pumpRevs ?.trim() !== ""
        );

        const rowHeight = 5;
        const pageBottom = 280;

        filteredData.forEach(item => {
            if (yPosicao + rowHeight > pageBottom) { // adjust for your margin
                doc.addPage();
                drawHeader();
            }
            doc.text(item.dateTime, xPosition, yPosicao);
            doc.text(item.pumpNo, xPosition + 34, yPosicao);
            doc.text(item.step, xPosition + 42, yPosicao);
            doc.text(formatNumber(item.tareWt, 3), xPosition + 67, yPosicao, { align: "center" });
            doc.text(formatNumber(item.grossWt, 3), xPosition + 83, yPosicao, { align: "center" });
            doc.text(formatNumber(item.netWt, 3), xPosition + 99, yPosicao, { align: "center" });
            doc.text(formatNumber(item.netVolume, 2), xPosition + 115, yPosicao, { align: "center" });
            doc.text(formatNumber(item.targetVolume, 2), xPosition + 131, yPosicao, { align: "center" });
            doc.text(formatNumber(item.differencePercent, 2), xPosition + 147, yPosicao, { align: "center" });
            doc.text(item.criteria, xPosition + 163, yPosicao, { align: "center" });
            doc.text(item.pumpRevs, xPosition + 179, yPosicao, { align: "center" });

            yPosicao += rowHeight; // Aumenta a posição vertical para a próxima linha
        });

        // 7. add page numbers after content
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Page ${i} of ${totalPages}`, 200, 5, { align: "center" });
        }

        // 8. Salvar o arquivo PDF
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const container = document.createElement('div');
        container.style.width = "100%";
        container.style.height = "100vh";
        container.style.display = "flex";
        container.style.flexDirection = "column";

        const backButton = document.createElement('button');
        backButton.textContent = "← Back";
        backButton.style = `
      background: #1976d2;
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
      align-self: flex-start;
    `;
        backButton.onclick = () => {
            window.location.reload(); // volta à tela inicial
        };

        const iframe = document.createElement('iframe');
        iframe.src = pdfUrl;
        iframe.style.width = "100%";
        iframe.style.flex = "1";
        iframe.style.border = "none";

        container.appendChild(backButton);
        container.appendChild(iframe);
        document.body.innerHTML = "";
        document.body.appendChild(container);
        //doc.save(`${reportName}.pdf`);

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
            item.userID ?.trim() !== "" &&
                item.acessLevel ?.trim() !== "" &&
                    item.addDate ?.trim() !== "" &&
                        item.enteredBy ?.trim() !== ""
        );

        filteredData.forEach(item => {
            if (yPosicao > 280) { // adjust for your margin
                doc.addPage();
                drawHeader();
            }
            doc.text(item.userID, xPosition, yPosicao);
            doc.text(item.acessLevel, xPosition + 60, yPosicao);
            doc.text(item.addDate, xPosition + 100, yPosicao);
            doc.text(item.enteredBy, xPosition + 150, yPosicao);

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
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const container = document.createElement('div');
        container.style.width = "100%";
        container.style.height = "100vh";
        container.style.display = "flex";
        container.style.flexDirection = "column";

        const backButton = document.createElement('button');
        backButton.textContent = "← Back";
        backButton.style = `
      background: #1976d2;
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
      align-self: flex-start;
    `;
        backButton.onclick = () => {
            window.location.reload(); // volta à tela inicial
        };

        const iframe = document.createElement('iframe');
        iframe.src = pdfUrl;
        iframe.style.width = "100%";
        iframe.style.flex = "1";
        iframe.style.border = "none";

        container.appendChild(backButton);
        container.appendChild(iframe);
        document.body.innerHTML = "";
        document.body.appendChild(container);
        //doc.save(`${reportName}.pdf`);

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
            item.userID ?.trim() !== "" &&
                item.acessLevel ?.trim() !== "" &&
                    item.addDate ?.trim() !== "" &&
                        item.enteredBy ?.trim() !== ""
        );

        filteredData.forEach(item => {
            if (yPosicao > 280) { // adjust for your margin
                doc.addPage();
                drawHeader();
            }
            doc.text(item.userID, xPosition, yPosicao);
            doc.text(item.acessLevel, xPosition + 50, yPosicao);
            doc.text(item.transactionType, xPosition + 80, yPosicao);
            doc.text(item.transactionDate, xPosition + 120, yPosicao);
            doc.text(item.transactedBy, xPosition + 160, yPosicao);

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
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const container = document.createElement('div');
        container.style.width = "100%";
        container.style.height = "100vh";
        container.style.display = "flex";
        container.style.flexDirection = "column";

        const backButton = document.createElement('button');
        backButton.textContent = "← Back";
        backButton.style = `
      background: #1976d2;
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
      align-self: flex-start;
    `;
        backButton.onclick = () => {
            window.location.reload(); // volta à tela inicial
        };

        const iframe = document.createElement('iframe');
        iframe.src = pdfUrl;
        iframe.style.width = "100%";
        iframe.style.flex = "1";
        iframe.style.border = "none";

        container.appendChild(backButton);
        container.appendChild(iframe);
        document.body.innerHTML = "";
        document.body.appendChild(container);
        //doc.save(`${reportName}.pdf`);

    } catch (erro) {
        console.error("Falha ao gerar o PDF:", erro);
        alert("An Error Occured! Verify the console for more details.");
    }
};

async function genSysHistoryReport(sysDataArray, reportName) {
    try {
        const headerInfo = await getReportHeaderInfo();

        const sysData = sysDataArray;
        let yPosicao = 65;
        let xPosition = 90;
        let n = sysDataArray[0].sysRevisionNo;

        // 2. Criar a instância jsPDF
        const doc = new jspdf.jsPDF({ orientation: 'l' });

        // 3. header function
        const drawHeader = () => {
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text('TEGAN 1063 - Automated Sample Recovery System', 10, 15);
            doc.text(reportName, 10, 25);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(`Report Date: ${headerInfo.reportDate}`, 10, 35);
            doc.text(`System ID: ${headerInfo.systemId}`, 10, 40);
            doc.text(`Database Name: ${headerInfo.databaseName}`, 100, 35);
            doc.text(`Printed by: ${headerInfo.printedBy}`, 100, 40);
            // line
            doc.line(10, 50, 215, 50);
            // table header
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(`Section`, 10, 55);
            doc.text(`Parameter`, 40, 55);
            doc.text(`Value`, 90, 55, { align: "right" });
            doc.text(`Revision`, 110, 55, { align: "center" });
            doc.text(`Created By`, 125, 55, { align: "left" });
            doc.text(`Date Created`, 210, 55, { align: "right" });
            doc.line(10, 57.5, 215, 57.5);
            // reset font
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            yPosicao = 65;
        };
        const drawRevision = (data = sysDataArray[n]) => {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text(`Revision: ${data.sysRevisionNo}`, 10, 61.5);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.text(`Calibration`, 10, 65);
            doc.text(`AcceptanceCriteria`, 40, 65);
            doc.text(`Calibration`, 10, 68);
            doc.text(`AllowableFailures`, 40, 68);
            doc.text(`Calibration`, 10, 71);
            doc.text(`Replicates`, 40, 71);
            doc.text(`Calibration`, 10, 74);
            doc.text(`PumpCallIntervalDays`, 40, 74);
            doc.text(`Calibration`, 10, 77);
            doc.text(`CloaseAppOnCompletation`, 40, 77);
            doc.text(`Calibration`, 10, 80);
            doc.text(`AirDryTimeOnCompletation`, 40, 80);
            doc.text(`General`, 10, 83);
            doc.text(`SealAndPump`, 40, 83);
            doc.text(`LeakTest`, 10, 86);
            doc.text(`AllowableLeakTestFailures`, 40, 86);
            doc.text(`LeakTest`, 10, 89);
            doc.text(`LeakTestBuildupTime`, 40, 89);
            doc.text(`LeakTest`, 10, 92);
            doc.text(`LeakTestHoldTime`, 40, 92);
            doc.text(`LeakTest`, 10, 95);
            doc.text(`LeakTestPressure`, 40, 95);
            doc.text(`Lift_Mechanism`, 10, 98);
            doc.text(`PlatesClosedPosition`, 40, 98);
            doc.text(`Lift_Mechanism`, 10, 101);
            doc.text(`PlatesDryPosition`, 40, 101);
            doc.text(`Lift_Mechanism`, 10, 104);
            doc.text(`PlatesVelocity`, 40, 104);
            doc.text(`Lift_Mechanism`, 10, 107);
            doc.text(`MaxCurrentFastDown`, 40, 107);
            doc.text(`Lift_Mechanism`, 10, 110);
            doc.text(`MaxCurrentSlowDown`, 40, 110);
            doc.text(`Lift_Mechanism`, 10, 113);
            doc.text(`MaxCurrentSlowUp`, 40, 113);
            doc.text(`Pumps`, 10, 116);
            doc.text(`MeterVelocity`, 40, 116);
            doc.text(`Pumps`, 10, 119);
            doc.text(`RunVelocity`, 40, 119);
            doc.text(`Pumps`, 10, 122);
            doc.text(`EmptyFactor`, 40, 122);
            doc.text(`Pumps`, 10, 125);
            doc.text(`FillSolventTubesFactor`, 40, 125);
            doc.text(`Sampler`, 10, 128);
            doc.text(`AboveCalibration`, 40, 128);
            doc.text(`Sampler`, 10, 131);
            doc.text(`AboveVialSet1`, 40, 131);
            doc.text(`Sampler`, 10, 134);
            doc.text(`VialSetSpacing`, 40, 134);
            doc.text(`Sampler`, 10, 137);
            doc.text(`IntoResBottom`, 40, 137);
            doc.text(`Sampler`, 10, 140);
            doc.text(`IntoResDispense`, 40, 140);
            doc.text(`Sampler`, 10, 143);
            doc.text(`IntoResWeigh`, 40, 143);
            doc.text(`Sampler`, 10, 146);
            doc.text(`IntoVials`, 40, 146);
            doc.text(`Sampler`, 10, 149);
            doc.text(`IntoWaste`, 40, 149);
            doc.text(`Security`, 10, 152);
            doc.text(`DisplayManualControl`, 40, 152);
            doc.text(`Security`, 10, 155);
            doc.text(`CheckLogonEachRun`, 40, 155);
        };

        drawHeader();
        //drawRevision();

        // 4. Add Data into the Table
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);

        // Filter out empty or invalid items before the loop
        const filteredData = sysData.filter(item =>
            item.cal_AcceptanceCriteria ?.trim() !== "" &&
                item.acessLevel ?.trim() !== "" &&
                    item.addDate ?.trim() !== "" &&
                        item.enteredBy ?.trim() !== ""
        );

        filteredData.forEach(item => {
            if (yPosicao > 90) { // adjust for your margin
                doc.addPage();
                drawHeader();
            }
            n = item.sysRevisionNo;
            drawRevision(sysDataArray.find(d => d.sysRevisionNo === n));

            doc.text(item.cal_AcceptanceCriteria, xPosition, yPosicao, { align: "right" });
            doc.text(item.sysRevisionNo.toString(), xPosition + 20, yPosicao, { align: "center" });
            doc.text(item.createdBy, 125, yPosicao);
            doc.text(item.createdDate, 210, yPosicao, { align: "right" });

            doc.text(item.cal_AllowableFail, xPosition, yPosicao + 3, { align: "right" });
            doc.text(item.sysRevisionNo.toString(), xPosition + 20, yPosicao + 3, { align: "center" });
            doc.text(item.createdBy, 125, yPosicao + 3);
            doc.text(item.createdDate, 210, yPosicao + 3, { align: "right" });

            doc.text(item.cal_Replicates, xPosition, yPosicao + 6, { align: "right" });
            doc.text(item.sysRevisionNo.toString(), xPosition + 20, yPosicao + 6, { align: "center" });
            doc.text(item.createdBy, 125, yPosicao + 6);
            doc.text(item.createdDate, 210, yPosicao + 6, { align: "right" });

            doc.text(item.cal_PumpCallIntervalDays, xPosition, yPosicao + 9, { align: "right" });
            doc.text(item.sysRevisionNo.toString(), xPosition + 20, yPosicao + 9, { align: "center" });
            doc.text(item.createdBy, 125, yPosicao + 9);
            doc.text(item.createdDate, 210, yPosicao + 9, { align: "right" });

            doc.text(item.cal_CloseAppOnCompletation, xPosition, yPosicao + 12, { align: "right" });
            doc.text(item.sysRevisionNo.toString(), xPosition + 20, yPosicao + 12, { align: "center" });
            doc.text(item.createdBy, 125, yPosicao + 12);
            doc.text(item.createdDate, 210, yPosicao + 12, { align: "right" });

            doc.text(item.AirDryTimeOnCompletation, xPosition, yPosicao + 15, { align: "right" });
            doc.text(item.sysRevisionNo.toString(), xPosition + 20, yPosicao + 15, { align: "center" });
            doc.text(item.createdBy, 125, yPosicao + 15);
            doc.text(item.createdDate, 210, yPosicao + 15, { align: "right" });

            doc.text(item.gen_SealAndPump, xPosition, yPosicao + 18, { align: "right" });
            doc.text(item.sysRevisionNo.toString(), xPosition + 20, yPosicao + 18, { align: "center" });
            doc.text(item.createdBy, 125, yPosicao + 18);
            doc.text(item.createdDate, 210, yPosicao + 18, { align: "right" });

            doc.text(item.lkt_AllowableLeakTestFail, xPosition, yPosicao + 21, { align: "right" });
            doc.text(item.sysRevisionNo.toString(), xPosition + 20, yPosicao + 21, { align: "center" });
            doc.text(item.createdBy, 125, yPosicao + 21);
            doc.text(item.createdDate, 210, yPosicao + 21, { align: "right" });

            doc.text(item.lkt_LeakTestBuildupTime, xPosition, yPosicao + 24, { align: "right" });
            doc.text(item.sysRevisionNo.toString(), xPosition + 20, yPosicao + 24, { align: "center" });
            doc.text(item.createdBy, 125, yPosicao + 24);
            doc.text(item.createdDate, 210, yPosicao + 24, { align: "right" });

            doc.text(item.lkt_LeakTestHoldTime, xPosition, yPosicao + 27, { align: "right" });
            doc.text(item.sysRevisionNo.toString(), xPosition + 20, yPosicao + 27, { align: "center" });
            doc.text(item.createdBy, 125, yPosicao + 27);
            doc.text(item.createdDate, 210, yPosicao + 27, { align: "right" });

            doc.text(item.lkt_LeakTestPressure, xPosition, yPosicao + 30, { align: "right" });
            doc.text(item.sysRevisionNo.toString(), xPosition + 20, yPosicao + 30, { align: "center" });
            doc.text(item.createdBy, 125, yPosicao + 30);
            doc.text(item.createdDate, 210, yPosicao + 30, { align: "right" });

            doc.text(item.mec_PlatesClosedPosition, xPosition, yPosicao + 33, { align: "right" });
            doc.text(item.sysRevisionNo.toString(), xPosition + 20, yPosicao + 33, { align: "center" });
            doc.text(item.createdBy, 125, yPosicao + 33);
            doc.text(item.createdDate, 210, yPosicao + 33, { align: "right" });

            doc.text(item.mec_PlatesDryPosition, xPosition, yPosicao + 36, { align: "right" });
            doc.text(item.sysRevisionNo.toString(), xPosition + 20, yPosicao + 36, { align: "center" });
            doc.text(item.createdBy, 125, yPosicao + 36);
            doc.text(item.createdDate, 210, yPosicao + 36, { align: "right" });

            doc.text(item.mec_PlatesVelocity, xPosition, yPosicao + 39, { align: "right" });
            doc.text(item.sysRevisionNo.toString(), xPosition + 20, yPosicao + 39, { align: "center" });
            doc.text(item.createdBy, 125, yPosicao + 39);
            doc.text(item.createdDate, 210, yPosicao + 39, { align: "right" });

            doc.text(item.mec_MaxCurrentFastDown, xPosition, yPosicao + 42, { align: "right" });
            doc.text(item.sysRevisionNo.toString(), xPosition + 20, yPosicao + 42, { align: "center" });
            doc.text(item.createdBy, 125, yPosicao + 42);
            doc.text(item.createdDate, 210, yPosicao + 42, { align: "right" });

            doc.text(item.mec_MaxCurrentSlowDown, xPosition, yPosicao + 45, { align: "right" });
            doc.text(item.sysRevisionNo.toString(), xPosition + 20, yPosicao + 45, { align: "center" });
            doc.text(item.createdBy, 125, yPosicao + 45);
            doc.text(item.createdDate, 210, yPosicao + 45, { align: "right" });

            doc.text(item.mec_MaxCurrentSlowUp, xPosition, yPosicao + 48, { align: "right" });
            doc.text(item.sysRevisionNo.toString(), xPosition + 20, yPosicao + 48, { align: "center" });
            doc.text(item.createdBy, 125, yPosicao + 48);
            doc.text(item.createdDate, 210, yPosicao + 48, { align: "right" });

            doc.text(item.pmp_MeterVelocity, xPosition, yPosicao + 51, { align: "right" });
            doc.text(item.sysRevisionNo.toString(), xPosition + 20, yPosicao + 51, { align: "center" });
            doc.text(item.createdBy, 125, yPosicao + 51);
            doc.text(item.createdDate, 210, yPosicao + 51, { align: "right" });

            doc.text(item.pmp_RunVelocity, xPosition, yPosicao + 54, { align: "right" });
            doc.text(item.sysRevisionNo.toString(), xPosition + 20, yPosicao + 54, { align: "center" });
            doc.text(item.createdBy, 125, yPosicao + 54);
            doc.text(item.createdDate, 210, yPosicao + 54, { align: "right" });

            doc.text(item.pmp_EmptyFactor, xPosition, yPosicao + 57, { align: "right" });
            doc.text(item.sysRevisionNo.toString(), xPosition + 20, yPosicao + 57, { align: "center" });
            doc.text(item.createdBy, 125, yPosicao + 57);
            doc.text(item.createdDate, 210, yPosicao + 57, { align: "right" });

            doc.text(item.pmp_FillSolventTubesFactor, xPosition, yPosicao + 60, { align: "right" });
            doc.text(item.sysRevisionNo.toString(), xPosition + 20, yPosicao + 60, { align: "center" });
            doc.text(item.createdBy, 125, yPosicao + 60);
            doc.text(item.createdDate, 210, yPosicao + 60, { align: "right" });

            doc.text(item.smp_AboveCalibration, xPosition, yPosicao + 63, { align: "right" });
            doc.text(item.sysRevisionNo.toString(), xPosition + 20, yPosicao + 63, { align: "center" });
            doc.text(item.createdBy, 125, yPosicao + 63);
            doc.text(item.createdDate, 210, yPosicao + 63, { align: "right" });



            doc.text(item.smp_VialSetSpacing, xPosition, yPosicao + 69, { align: "right" });
            doc.text(item.sysRevisionNo.toString(), xPosition + 20, yPosicao + 69, { align: "center" });
            doc.text(item.createdBy, 125, yPosicao + 69);
            doc.text(item.createdDate, 210, yPosicao + 69, { align: "right" });

            doc.text(item.smp_IntoResBottom, xPosition, yPosicao + 72, { align: "right" });
            doc.text(item.sysRevisionNo.toString(), xPosition + 20, yPosicao + 72, { align: "center" });
            doc.text(item.createdBy, 125, yPosicao + 72);
            doc.text(item.createdDate, 210, yPosicao + 72, { align: "right" });

            doc.text(item.smp_IntoResDispense, xPosition, yPosicao + 75, { align: "right" });
            doc.text(item.sysRevisionNo.toString(), xPosition + 20, yPosicao + 75, { align: "center" });
            doc.text(item.createdBy, 125, yPosicao + 75);
            doc.text(item.createdDate, 210, yPosicao + 75, { align: "right" });

            doc.text(item.smp_IntoResWeigh, xPosition, yPosicao + 78, { align: "right" });
            doc.text(item.sysRevisionNo.toString(), xPosition + 20, yPosicao + 78, { align: "center" });
            doc.text(item.createdBy, 125, yPosicao + 78);
            doc.text(item.createdDate, 210, yPosicao + 78, { align: "right" });

            doc.text(item.smp_IntoVials, xPosition, yPosicao + 84, { align: "right" });
            doc.text(item.sysRevisionNo.toString(), xPosition + 20, yPosicao + 84, { align: "center" });
            doc.text(item.createdBy, 125, yPosicao + 84);
            doc.text(item.createdDate, 210, yPosicao + 84, { align: "right" });



            doc.text(item.sec_DisplayManualControl, xPosition, yPosicao + 87, { align: "right" });
            doc.text(item.sysRevisionNo.toString(), xPosition + 20, yPosicao + 87, { align: "center" });
            doc.text(item.createdBy, 125, yPosicao + 87);
            doc.text(item.createdDate, 210, yPosicao + 87, { align: "right" });

            doc.text(item.sec_CheckLogonEachRun, xPosition, yPosicao + 90, { align: "right" });
            doc.text(item.sysRevisionNo.toString(), xPosition + 20, yPosicao + 90, { align: "center" });
            doc.text(item.createdBy, 125, yPosicao + 90);
            doc.text(item.createdDate, 210, yPosicao + 90, { align: "right" });



            yPosicao += 95; // Aumenta a posição vertical para a próxima linha

        });

        // 5. add page numbers after content
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Page ${i} of ${totalPages}`, 200, 5, { align: "center" });
        }

        // 6. Save PDF File
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const container = document.createElement('div');
        container.style.width = "100%";
        container.style.height = "100vh";
        container.style.display = "flex";
        container.style.flexDirection = "column";

        const backButton = document.createElement('button');
        backButton.textContent = "← Back";
        backButton.style = `
      background: #1976d2;
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
      align-self: flex-start;
    `;
        backButton.onclick = () => {
            window.location.reload(); // volta à tela inicial
        };

        const iframe = document.createElement('iframe');
        iframe.src = pdfUrl;
        iframe.style.width = "100%";
        iframe.style.flex = "1";
        iframe.style.border = "none";

        container.appendChild(backButton);
        container.appendChild(iframe);
        document.body.innerHTML = "";
        document.body.appendChild(container);
        //doc.save(`${reportName}.pdf`);

    } catch (erro) {
        console.error("Falha ao gerar o PDF:", erro);
        alert("An Error Occured! Verify the console for more details.");
    }
};

async function genUsersAndGroupsReport(users, groups, reportName) {
    try {
        const headerInfo = await getReportHeaderInfo();
        const doc = new jspdf.jsPDF();

        let y = 60;

        function drawHeader(pageNumber) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text('TEGAN 1063 - Automated Sample Recovery System', 10, 15);
            doc.text(reportName, 10, 25);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(`Report Date: ${headerInfo.reportDate}`, 10, 35);
            doc.text(`System ID: ${headerInfo.systemId}`, 100, 35);
            doc.text(`Database Name: ${headerInfo.databaseName}`, 100, 40);
            doc.text(`Printed by: ${headerInfo.printedBy}`, 100, 45);

            doc.setFontSize(8);
            doc.text(`Page ${pageNumber}`, 200, 5, { align: "center" });

            doc.line(10, 50, 200, 50);
        }

        function ensurePageSpace(extra = 10) {
            if (y + extra > 280) {
                doc.addPage();
                pageNumber++;
                drawHeader(pageNumber);
                y = 60;
            }
        }

        let pageNumber = 1;
        drawHeader(pageNumber);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text('Current Users', 10, y);
        y += 8;

        doc.setFontSize(10);
        doc.text('Username', 15, y);
        doc.text('Groups', 80, y);
        doc.line(10, y + 2, 190, y + 2);
        y += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);

        (users || []).forEach(function (user) {
            ensurePageSpace(6);
            doc.text(String(user.username || ''), 15, y);
            doc.text(String(user.groups || ''), 80, y);
            y += 6;
        });

        y += 8;
        ensurePageSpace(16);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text('Current Groups', 10, y);
        y += 8;

        doc.setFontSize(10);
        doc.text('Group Name', 15, y);
        doc.line(10, y + 2, 100, y + 2);
        y += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);

        (groups || []).forEach(group => {
            ensurePageSpace(6);
            doc.text(String(group || ''), 15, y);
            y += 6;
        });

        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Page ${i} of ${totalPages}`, 200, 5, { align: "center" });
        }

        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);

        const container = document.createElement('div');
        container.style.width = "100%";
        container.style.height = "100vh";
        container.style.display = "flex";
        container.style.flexDirection = "column";

        const backButton = document.createElement('button');
        backButton.textContent = "← Back";
        backButton.style = `
            background: #1976d2;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
            align-self: flex-start;
        `;
        backButton.onclick = () => window.location.reload();

        const iframe = document.createElement('iframe');
        iframe.src = pdfUrl;
        iframe.style.width = "100%";
        iframe.style.flex = "1";
        iframe.style.border = "none";

        container.appendChild(backButton);
        container.appendChild(iframe);
        document.body.innerHTML = "";
        document.body.appendChild(container);

    } catch (erro) {
        console.error("Falha ao gerar o PDF de usuários e grupos:", erro);
        alert("An Error Occured! Verify the console for more details.");
    }
}

async function genCurrentSysReport(sysDataArray, reportName) {
    try {
        const headerInfo = await getReportHeaderInfo();

        const sysData = sysDataArray;
        let yPosicao = 65;
        let xPosition = 90;
        let n = sysDataArray.sysRevisionNo;

        // 2. Criar a instância jsPDF
        const doc = new jspdf.jsPDF({ orientation: 'l' });

        // 3. header function
        const drawHeader = () => {
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text('TEGAN 1063 - Automated Sample Recovery System', 10, 15);
            doc.text(reportName, 10, 25);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(`Report Date: ${headerInfo.reportDate}`, 10, 35);
            doc.text(`System ID: ${headerInfo.systemId}`, 10, 40);
            doc.text(`Database Name: ${headerInfo.databaseName}`, 100, 35);
            doc.text(`Printed by: ${headerInfo.printedBy}`, 100, 40);
            // line
            doc.line(10, 50, 215, 50);
            // table header
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(`Section`, 10, 55);
            doc.text(`Parameter`, 42, 55);
            doc.text(`Value`, 118, 55, { align: "right" });
            doc.text(`Revision`, 145, 55, { align: "center" });
            doc.text(`Created By`, 162, 55, { align: "left" });
            doc.text(`Date Created`, 210, 55, { align: "right" });
            doc.line(10, 57.5, 215, 57.5);
            // reset font
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            yPosicao = 65;
        };
        const drawRevision = () => {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text(`Revision: ${sysData.sysRevisionNo}`, 10, 61.5);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.text(`Calibration`, 10, 65);
            doc.text(`AcceptanceCriteria`, 42, 65);
            doc.text(`Calibration`, 10, 68);
            doc.text(`AllowableFailures`, 42, 68);
            doc.text(`Calibration`, 10, 71);
            doc.text(`Replicates`, 42, 71);
            doc.text(`Calibration`, 10, 74);
            doc.text(`PumpCallIntervalDays`, 42, 74);
            doc.text(`Calibration`, 10, 77);
            doc.text(`CloaseAppOnCompletation`, 42, 77);
            doc.text(`Calibration`, 10, 80);
            doc.text(`AirDryTimeOnCompletation`, 42, 80);
            doc.text(`General`, 10, 83);
            doc.text(`SealAndPump`, 42, 83);
            doc.text(`LeakTest`, 10, 86);
            doc.text(`AllowableLeakTestFailures`, 42, 86);
            doc.text(`LeakTest`, 10, 89);
            doc.text(`LeakTestBuildupTime`, 42, 89);
            doc.text(`LeakTest`, 10, 92);
            doc.text(`LeakTestHoldTime`, 42, 92);
            doc.text(`LeakTest`, 10, 95);
            doc.text(`LeakTestPressure`, 42, 95);
            doc.text(`Lift_Mechanism`, 10, 98);
            doc.text(`PlatesClosedPosition`, 42, 98);
            doc.text(`Lift_Mechanism`, 10, 101);
            doc.text(`PlatesDryPosition`, 42, 101);
            doc.text(`Lift_Mechanism`, 10, 104);
            doc.text(`PlatesVelocity`, 42, 104);
            doc.text(`Lift_Mechanism`, 10, 107);
            doc.text(`MaxCurrentFastDown`, 42, 107);
            doc.text(`Lift_Mechanism`, 10, 110);
            doc.text(`MaxCurrentSlowDown`, 42, 110);
            doc.text(`Lift_Mechanism`, 10, 113);
            doc.text(`MaxCurrentSlowUp`, 42, 113);
            doc.text(`Pumps`, 10, 116);
            doc.text(`MeterVelocity`, 42, 116);
            doc.text(`Pumps`, 10, 119);
            doc.text(`RunVelocity`, 42, 119);
            doc.text(`Pumps`, 10, 122);
            doc.text(`EmptyFactor`, 42, 122);
            doc.text(`Pumps`, 10, 125);
            doc.text(`FillSolventTubesFactor`, 42, 125);
            doc.text(`Sampler`, 10, 128);
            doc.text(`AboveCalibration`, 42, 128);
            doc.text(`Sampler`, 10, 131);
            doc.text(`AboveVialSet1`, 42, 131);
            doc.text(`Sampler`, 10, 134);
            doc.text(`VialSetSpacing`, 42, 134);
            doc.text(`Sampler`, 10, 137);
            doc.text(`IntoResBottom`, 42, 137);
            doc.text(`Sampler`, 10, 140);
            doc.text(`IntoResDispense`, 42, 140);
            doc.text(`Sampler`, 10, 143);
            doc.text(`IntoResWeigh`, 42, 143);
            doc.text(`Sampler`, 10, 146);
            doc.text(`IntoVials`, 42, 146);
            doc.text(`Sampler`, 10, 149);
            doc.text(`IntoWaste`, 42, 149);
            doc.text(`Security`, 10, 152);
            doc.text(`DisplayManualControl`, 42, 152);
            doc.text(`Security`, 10, 155);
            doc.text(`CheckLogonEachRun`, 42, 155);
        };

        drawHeader();
        //drawRevision();

        // 4. Add Data into the Table
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);



        if (yPosicao > 90) { // adjust for your margin
            doc.addPage();
            drawHeader();
        }
        n = sysData.sysRevisionNo;
        drawRevision();

        doc.text(sysData.cal_AcceptanceCriteria, 118, yPosicao, { align: "right" });
        doc.text(sysData.sysRevisionNo.toString(), 145, yPosicao, { align: "center" });
        doc.text(sysData.createdBy, 162, yPosicao);
        doc.text(sysData.createdDate, 210, yPosicao, { align: "right" });

        doc.text(sysData.cal_AllowableFail, 118, yPosicao + 3, { align: "right" });
        doc.text(sysData.sysRevisionNo.toString(), 145, yPosicao + 3, { align: "center" });
        doc.text(sysData.createdBy, 162, yPosicao + 3);
        doc.text(sysData.createdDate, 210, yPosicao + 3, { align: "right" });

        doc.text(sysData.cal_Replicates, 118, yPosicao + 6, { align: "right" });
        doc.text(sysData.sysRevisionNo.toString(), 145, yPosicao + 6, { align: "center" });
        doc.text(sysData.createdBy, 162, yPosicao + 6);
        doc.text(sysData.createdDate, 210, yPosicao + 6, { align: "right" });

        doc.text(sysData.cal_PumpCallIntervalDays, 118, yPosicao + 9, { align: "right" });
        doc.text(sysData.sysRevisionNo.toString(), 145, yPosicao + 9, { align: "center" });
        doc.text(sysData.createdBy, 162, yPosicao + 9);
        doc.text(sysData.createdDate, 210, yPosicao + 9, { align: "right" });

        doc.text(sysData.cal_CloseAppOnCompletation, 118, yPosicao + 12, { align: "right" });
        doc.text(sysData.sysRevisionNo.toString(), 145, yPosicao + 12, { align: "center" });
        doc.text(sysData.createdBy, 162, yPosicao + 12);
        doc.text(sysData.createdDate, 210, yPosicao + 12, { align: "right" });

        doc.text(sysData.AirDryTimeOnCompletation, 118, yPosicao + 15, { align: "right" });
        doc.text(sysData.sysRevisionNo.toString(), 145, yPosicao + 15, { align: "center" });
        doc.text(sysData.createdBy, 162, yPosicao + 15);
        doc.text(sysData.createdDate, 210, yPosicao + 15, { align: "right" });

        doc.text(sysData.gen_SealAndPump, 118, yPosicao + 18, { align: "right" });
        doc.text(sysData.sysRevisionNo.toString(), 145, yPosicao + 18, { align: "center" });
        doc.text(sysData.createdBy, 162, yPosicao + 18);
        doc.text(sysData.createdDate, 210, yPosicao + 18, { align: "right" });

        doc.text(sysData.lkt_AllowableLeakTestFail, 118, yPosicao + 21, { align: "right" });
        doc.text(sysData.sysRevisionNo.toString(), 145, yPosicao + 21, { align: "center" });
        doc.text(sysData.createdBy, 162, yPosicao + 21);
        doc.text(sysData.createdDate, 210, yPosicao + 21, { align: "right" });

        doc.text(sysData.lkt_LeakTestBuildupTime, 118, yPosicao + 24, { align: "right" });
        doc.text(sysData.sysRevisionNo.toString(), 145, yPosicao + 24, { align: "center" });
        doc.text(sysData.createdBy, 162, yPosicao + 24);
        doc.text(sysData.createdDate, 210, yPosicao + 24, { align: "right" });

        doc.text(sysData.lkt_LeakTestHoldTime, 118, yPosicao + 27, { align: "right" });
        doc.text(sysData.sysRevisionNo.toString(), 145, yPosicao + 27, { align: "center" });
        doc.text(sysData.createdBy, 162, yPosicao + 27);
        doc.text(sysData.createdDate, 210, yPosicao + 27, { align: "right" });

        doc.text(sysData.lkt_LeakTestPressure, 118, yPosicao + 30, { align: "right" });
        doc.text(sysData.sysRevisionNo.toString(), 145, yPosicao + 30, { align: "center" });
        doc.text(sysData.createdBy, 162, yPosicao + 30);
        doc.text(sysData.createdDate, 210, yPosicao + 30, { align: "right" });

        doc.text(sysData.mec_PlatesClosedPosition, 118, yPosicao + 33, { align: "right" });
        doc.text(sysData.sysRevisionNo.toString(), 145, yPosicao + 33, { align: "center" });
        doc.text(sysData.createdBy, 162, yPosicao + 33);
        doc.text(sysData.createdDate, 210, yPosicao + 33, { align: "right" });

        doc.text(sysData.mec_PlatesDryPosition, 118, yPosicao + 36, { align: "right" });
        doc.text(sysData.sysRevisionNo.toString(), 145, yPosicao + 36, { align: "center" });
        doc.text(sysData.createdBy, 162, yPosicao + 36);
        doc.text(sysData.createdDate, 210, yPosicao + 36, { align: "right" });

        doc.text(sysData.mec_PlatesVelocity, 118, yPosicao + 39, { align: "right" });
        doc.text(sysData.sysRevisionNo.toString(), 145, yPosicao + 39, { align: "center" });
        doc.text(sysData.createdBy, 162, yPosicao + 39);
        doc.text(sysData.createdDate, 210, yPosicao + 39, { align: "right" });

        doc.text(sysData.mec_MaxCurrentFastDown, 118, yPosicao + 42, { align: "right" });
        doc.text(sysData.sysRevisionNo.toString(), 145, yPosicao + 42, { align: "center" });
        doc.text(sysData.createdBy, 162, yPosicao + 42);
        doc.text(sysData.createdDate, 210, yPosicao + 42, { align: "right" });

        doc.text(sysData.mec_MaxCurrentSlowDown, 118, yPosicao + 45, { align: "right" });
        doc.text(sysData.sysRevisionNo.toString(), 145, yPosicao + 45, { align: "center" });
        doc.text(sysData.createdBy, 162, yPosicao + 45);
        doc.text(sysData.createdDate, 210, yPosicao + 45, { align: "right" });

        doc.text(sysData.mec_MaxCurrentSlowUp, 118, yPosicao + 48, { align: "right" });
        doc.text(sysData.sysRevisionNo.toString(), 145, yPosicao + 48, { align: "center" });
        doc.text(sysData.createdBy, 162, yPosicao + 48);
        doc.text(sysData.createdDate, 210, yPosicao + 48, { align: "right" });

        doc.text(sysData.pmp_MeterVelocity, 118, yPosicao + 51, { align: "right" });
        doc.text(sysData.sysRevisionNo.toString(), 145, yPosicao + 51, { align: "center" });
        doc.text(sysData.createdBy, 162, yPosicao + 51);
        doc.text(sysData.createdDate, 210, yPosicao + 51, { align: "right" });

        doc.text(sysData.pmp_RunVelocity, 118, yPosicao + 54, { align: "right" });
        doc.text(sysData.sysRevisionNo.toString(), 145, yPosicao + 54, { align: "center" });
        doc.text(sysData.createdBy, 162, yPosicao + 54);
        doc.text(sysData.createdDate, 210, yPosicao + 54, { align: "right" });

        doc.text(sysData.pmp_EmptyFactor, 118, yPosicao + 57, { align: "right" });
        doc.text(sysData.sysRevisionNo.toString(), 145, yPosicao + 57, { align: "center" });
        doc.text(sysData.createdBy, 162, yPosicao + 57);
        doc.text(sysData.createdDate, 210, yPosicao + 57, { align: "right" });

        doc.text(sysData.pmp_FillSolventTubesFactor, 118, yPosicao + 60, { align: "right" });
        doc.text(sysData.sysRevisionNo.toString(), 145, yPosicao + 60, { align: "center" });
        doc.text(sysData.createdBy, 162, yPosicao + 60);
        doc.text(sysData.createdDate, 210, yPosicao + 60, { align: "right" });

        doc.text(sysData.smp_AboveCalibration, 118, yPosicao + 63, { align: "right" });
        doc.text(sysData.sysRevisionNo.toString(), 145, yPosicao + 63, { align: "center" });
        doc.text(sysData.createdBy, 162, yPosicao + 63);
        doc.text(sysData.createdDate, 210, yPosicao + 63, { align: "right" });



        doc.text(sysData.smp_VialSetSpacing, 118, yPosicao + 69, { align: "right" });
        doc.text(sysData.sysRevisionNo.toString(), 145, yPosicao + 69, { align: "center" });
        doc.text(sysData.createdBy, 162, yPosicao + 69);
        doc.text(sysData.createdDate, 210, yPosicao + 69, { align: "right" });

        doc.text(sysData.smp_IntoResBottom, 118, yPosicao + 72, { align: "right" });
        doc.text(sysData.sysRevisionNo.toString(), 145, yPosicao + 72, { align: "center" });
        doc.text(sysData.createdBy, 162, yPosicao + 72);
        doc.text(sysData.createdDate, 210, yPosicao + 72, { align: "right" });

        doc.text(sysData.smp_IntoResDispense, 118, yPosicao + 75, { align: "right" });
        doc.text(sysData.sysRevisionNo.toString(), 145, yPosicao + 75, { align: "center" });
        doc.text(sysData.createdBy, 162, yPosicao + 75);
        doc.text(sysData.createdDate, 210, yPosicao + 75, { align: "right" });

        doc.text(sysData.smp_IntoResWeigh, 118, yPosicao + 78, { align: "right" });
        doc.text(sysData.sysRevisionNo.toString(), 145, yPosicao + 78, { align: "center" });
        doc.text(sysData.createdBy, 162, yPosicao + 78);
        doc.text(sysData.createdDate, 210, yPosicao + 78, { align: "right" });

        doc.text(sysData.smp_IntoVials, 118, yPosicao + 84, { align: "right" });
        doc.text(sysData.sysRevisionNo.toString(), 145, yPosicao + 84, { align: "center" });
        doc.text(sysData.createdBy, 162, yPosicao + 84);
        doc.text(sysData.createdDate, 210, yPosicao + 84, { align: "right" });



        doc.text(sysData.sec_DisplayManualControl, 118, yPosicao + 87, { align: "right" });
        doc.text(sysData.sysRevisionNo.toString(), 145, yPosicao + 87, { align: "center" });
        doc.text(sysData.createdBy, 162, yPosicao + 87);
        doc.text(sysData.createdDate, 210, yPosicao + 87, { align: "right" });

        doc.text(sysData.sec_CheckLogonEachRun, 118, yPosicao + 90, { align: "right" });
        doc.text(sysData.sysRevisionNo.toString(), 145, yPosicao + 90, { align: "center" });
        doc.text(sysData.createdBy, 162, yPosicao + 90);
        doc.text(sysData.createdDate, 210, yPosicao + 90, { align: "right" });



        yPosicao += 95; // Aumenta a posição vertical para a próxima linha



        // 5. add page numbers after content
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Page ${i} of ${totalPages}`, 200, 5, { align: "center" });
        }

        // 6. Save PDF File
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const container = document.createElement('div');
        container.style.width = "100%";
        container.style.height = "100vh";
        container.style.display = "flex";
        container.style.flexDirection = "column";

        const backButton = document.createElement('button');
        backButton.textContent = "← Back";
        backButton.style = `
      background: #1976d2;
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
      align-self: flex-start;
    `;
        backButton.onclick = () => {
            window.location.reload(); // volta à tela inicial
        };

        const iframe = document.createElement('iframe');
        iframe.src = pdfUrl;
        iframe.style.width = "100%";
        iframe.style.flex = "1";
        iframe.style.border = "none";

        container.appendChild(backButton);
        container.appendChild(iframe);
        document.body.innerHTML = "";
        document.body.appendChild(container);
        //doc.save(`${reportName}.pdf`);

    } catch (erro) {
        console.error("Falha ao gerar o PDF:", erro);
        alert("An Error Occured! Verify the console for more details.");
    }
};

async function genLinearReport(linearDataArray, reportName) {
    try {
        const headerInfo = await getReportHeaderInfo();

        const linearData = linearDataArray;
        const doc = new jspdf.jsPDF();

        let y = 70;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text('TEGAN 1063 - Automated Sample Recovery System', 10, 15);
        doc.text(reportName, 10, 25);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Report Date: ${headerInfo.reportDate}`, 10, 35);
        doc.text(`System ID: ${headerInfo.systemId}`, 100, 35);
        doc.text(`Database Name: ${headerInfo.databaseName}`, 100, 40);
        doc.text(`Printed by: ${headerInfo.printedBy}`, 100, 45);

        doc.line(10, 50, 200, 50);

        doc.setFont("helvetica", "bold");
        doc.text(`Record ID:`, 10, 58);
        doc.text(`Changed By:`, 80, 58);
        doc.text(`Changed On:`, 140, 58);

        doc.setFont("helvetica", "normal");
        doc.text(String(linearData.ID_Linear || ''), 28, 58);
        doc.text(String(linearData.changedBy || ''), 102, 58);
        doc.text(String(linearData.changedOn || ''), 164, 58);

        doc.line(10, 62, 200, 62);

        doc.setFont("helvetica", "bold");
        doc.text('Pump', 20, y);
        doc.text('Position', 80, y);
        doc.line(10, y + 2, 200, y + 2);

        y += 10;
        doc.setFont("helvetica", "normal");

        const rows = [
            ['Pump 1', linearData.pump1],
            ['Pump 2', linearData.pump2],
            ['Pump 3', linearData.pump3],
            ['Pump 4', linearData.pump4],
            ['Pump 5', linearData.pump5],
            ['Pump 6', linearData.pump6],
            ['Pump 7', linearData.pump7],
            ['Pump 8', linearData.pump8],
            ['Pump 9', linearData.pump9],
            ['Pump 10', linearData.pump10]
        ];

        rows.forEach(row => {
            doc.text(String(row[0] || ''), 20, y);
            doc.text(String(row[1] || ''), 80, y);
            y += 8;
        });

        doc.line(10, y - 3, 200, y - 3);

        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Page ${i} of ${totalPages}`, 200, 5, { align: "center" });
        }

        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const container = document.createElement('div');
        container.style.width = "100%";
        container.style.height = "100vh";
        container.style.display = "flex";
        container.style.flexDirection = "column";

        const backButton = document.createElement('button');
        backButton.textContent = "← Back";
        backButton.style = `
            background: #1976d2;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
            align-self: flex-start;
        `;
        backButton.onclick = () => {
            window.location.reload();
        };

        const iframe = document.createElement('iframe');
        iframe.src = pdfUrl;
        iframe.style.width = "100%";
        iframe.style.flex = "1";
        iframe.style.border = "none";

        container.appendChild(backButton);
        container.appendChild(iframe);
        document.body.innerHTML = "";
        document.body.appendChild(container);

    } catch (erro) {
        console.error("Generate PDF Failed:", erro);
        alert("An Error Occured! Verify the console for more details.");
    }
}

async function genCompleteMethodReport(allRevisions, reportName) {
    try {
        const headerInfo = await getReportHeaderInfo();
        const doc = new jspdf.jsPDF();
        const validMethods = (allRevisions || []).filter(m =>
            m &&
            m.methodName &&
            String(m.methodName).trim() !== ""
        );

        if (validMethods.length === 0) {
            alert('No method history records found.');
            return;
        }

        validMethods.forEach((methodData, index) => {
            if (index > 0) doc.addPage();

            let xPosition = 10;
            let yPosicao = 80;

            // Header
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text("TEGAN 1063 - Automated Sample Recovery System", 10, 15);
            doc.text(`${reportName} - Revision ${methodData.methodRevision}`, 10, 25);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(`Report Date: ${headerInfo.reportDate}`, 10, 35);
            doc.text(`System ID: ${headerInfo.systemId}`, 100, 35);
            doc.text(`Database Name: ${headerInfo.databaseName}`, 100, 40);
            doc.text(`Printed by: ${headerInfo.printedBy}`, 100, 45);

            doc.line(10, 50, 200, 50);

            // Method info
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text("Method Name:", 35, 55, { align: "right" });
            doc.text("Revision:", 35, 60, { align: "right" });
            doc.text("Created By:", 35, 65, { align: "right" });
            doc.text("On:", 35, 70, { align: "right" });

            doc.setFont("helvetica", "normal");
            doc.text(String(methodData.methodName || ''), 35, 55);
            doc.text(String(methodData.methodRevision || ''), 35, 60);
            doc.text(String(methodData.methodCreatedBy || ''), 35, 65);
            doc.text(String(methodData.methodCreatedOn || ''), 35, 70);

            // Step Parameters
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.text("Step Parameters", xPosition, yPosicao, { align: "left" });
            doc.text("Rinse 1", xPosition + 60, yPosicao, { align: "center" });
            doc.text("Rinse 2", xPosition + 80, yPosicao, { align: "center" });
            doc.text("Wash 1", xPosition + 100, yPosicao, { align: "center" });
            doc.text("Wash 2", xPosition + 120, yPosicao, { align: "center" });
            doc.text("Solvent #", xPosition + 35, yPosicao + 10, { align: "right" });
            doc.text("Time (sec)", xPosition + 35, yPosicao + 15, { align: "right" });
            doc.text("Velocity (RPM)", xPosition + 35, yPosicao + 20, { align: "right" });

            yPosicao += 5;
            doc.line(xPosition, yPosicao, 145, yPosicao);
            yPosicao += 5;
            doc.line(50, 75, 50, 105);
            doc.line(xPosition, 105, 145, 105);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.text(String(methodData.solvent_R1 || ''), xPosition + 60, yPosicao, { align: "center" });
            doc.text(String(methodData.solvent_R2 || ''), xPosition + 80, yPosicao, { align: "center" });
            doc.text(String(methodData.solvent_W1 || ''), xPosition + 100, yPosicao, { align: "center" });
            doc.text(String(methodData.solvent_W2 || ''), xPosition + 120, yPosicao, { align: "center" });

            yPosicao += 5;
            doc.text(timeToSecondsString(methodData.time_R1), xPosition + 60, yPosicao, { align: "center" });
            doc.text(timeToSecondsString(methodData.time_R2), xPosition + 80, yPosicao, { align: "center" });
            doc.text(timeToSecondsString(methodData.time_W1), xPosition + 100, yPosicao, { align: "center" });
            doc.text(timeToSecondsString(methodData.time_W2), xPosition + 120, yPosicao, { align: "center" });

            yPosicao += 5;
            doc.text(String(methodData.velocity_R1 || ''), xPosition + 60, yPosicao, { align: "center" });
            doc.text(String(methodData.velocity_R2 || ''), xPosition + 80, yPosicao, { align: "center" });
            doc.text(String(methodData.velocity_W1 || ''), xPosition + 100, yPosicao, { align: "center" });
            doc.text(String(methodData.velocity_W2 || ''), xPosition + 120, yPosicao, { align: "center" });

            // Misc Parameters
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text("Misc. Parameters", 170, 80, { align: "center" });

            doc.setFont("helvetica", "normal");
            doc.text(`Soak Time: `, 180, 85, { align: "right" });
            doc.text(` ${timeToSecondsString(methodData.soakTime)} sec`, 180, 85, { align: "left" });
            doc.text(`Agitate 1 Time: `, 180, 90, { align: "right" });
            doc.text(` ${timeToSecondsString(methodData.agitate_1_Time)} sec`, 180, 90, { align: "left" });
            doc.text(`Agitate 2 Time: `, 180, 95, { align: "right" });
            doc.text(` ${timeToSecondsString(methodData.agitate_2_Time)} sec`, 180, 95, { align: "left" });
            doc.text(`Vials to Fill: `, 180, 100, { align: "right" });
            doc.text(` ${String(methodData.vialsToFill || '')}`, 180, 100, { align: "left" });
            doc.text(`Vial Prime Vol: `, 180, 105, { align: "right" });
            doc.text(` ${String(methodData.vialPrimeVol || '')} ml`, 180, 105, { align: "left" });
            doc.text(`Vial 1 Fill Vol: `, 180, 110, { align: "right" });
            doc.text(` ${String(methodData.vial_1_FillVol || '')} ml`, 180, 110, { align: "left" });
            doc.text(`Vial 2-4 Fill Vol: `, 180, 115, { align: "right" });
            doc.text(` ${String(methodData.vial_2_4_FillVol || '')} ml`, 180, 115, { align: "left" });
            doc.text(`Air Dry Time: `, 180, 120, { align: "right" });
            doc.text(` ${timeToSecondsString(methodData.airDryTime)} sec`, 180, 120, { align: "left" });

            yPosicao += 25;

            // Volume Data Table
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text("Volume Data", xPosition + 15, yPosicao, { align: "center" });
            doc.setFontSize(8);
            doc.text("Pump", xPosition + 15, yPosicao + 5, { align: "center" });
            doc.text("Stage", xPosition + 35, yPosicao + 5, { align: "center" });
            doc.text("Rinse 1", xPosition + 47, yPosicao + 5, { align: "center" });
            doc.text("Rinse 2", xPosition + 67, yPosicao + 5, { align: "center" });
            doc.text("Wash 1", xPosition + 83, yPosicao + 5, { align: "center" });
            doc.text("Wash 2", xPosition + 99, yPosicao + 5, { align: "center" });

            yPosicao += 10;
            doc.line(xPosition, yPosicao, 200, yPosicao);
            yPosicao += 5;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);

            const volumeData = (methodData.volumeData || []).filter(v =>
                v &&
                String(v.pump || '').trim() !== ''
            );

            volumeData.forEach(v => {
                doc.text(String(v.pump || ''), xPosition + 15, yPosicao, { align: "center" });
                doc.text(String(v.stage || ''), xPosition + 35, yPosicao, { align: "center" });
                doc.text(String(v.rinse1 || ''), xPosition + 47, yPosicao, { align: "center" });
                doc.text(String(v.rinse2 || ''), xPosition + 67, yPosicao, { align: "center" });
                doc.text(String(v.wash1 || ''), xPosition + 83, yPosicao, { align: "center" });
                doc.text(String(v.wash2 || ''), xPosition + 99, yPosicao, { align: "center" });
                yPosicao += 5;
            });

            doc.line(xPosition, yPosicao, 200, yPosicao);
        });

        const totalPages = doc.internal.getNumberOfPages();
        for (let p = 1; p <= totalPages; p++) {
            doc.setPage(p);
            doc.setFontSize(8);
            doc.text(`Page ${p}/${totalPages}`, 200, 5, { align: "center" });
        }

        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);

        const container = document.createElement('div');
        container.style.width = "100%";
        container.style.height = "100vh";
        container.style.display = "flex";
        container.style.flexDirection = "column";

        const backButton = document.createElement('button');
        backButton.textContent = "← Back";
        backButton.style = `
            background: #1976d2;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
            align-self: flex-start;
        `;
        backButton.onclick = () => {
            window.location.reload();
        };

        const iframe = document.createElement('iframe');
        iframe.src = pdfUrl;
        iframe.style.width = "100%";
        iframe.style.flex = "1";
        iframe.style.border = "none";

        container.appendChild(backButton);
        container.appendChild(iframe);
        document.body.innerHTML = "";
        document.body.appendChild(container);

    } catch (erro) {
        console.error("Falha ao gerar o Complete Method Report:", erro);
        alert("An Error Occured! Verify the console for more details.");
    }
}

async function genLinearHistoryReport(historyArray, reportName) {
    try {
        const headerInfo = await getReportHeaderInfo();
        const doc = new jspdf.jsPDF('landscape');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        const rows = (historyArray || []).filter(item =>
            item &&
            String(item.ID_Linear || '').trim() !== ''
        );

        let y = 64;
        const rowHeight = 6;

        function drawHeader(pageNumber) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text("TEGAN 1063 - Automated Sample Recovery System", 10, 15);
            doc.text(reportName, 10, 25);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(`Report Date: ${headerInfo.reportDate}`, 10, 35);
            doc.text(`System ID: ${headerInfo.systemId}`, 90, 35);
            doc.text(`Database Name: ${headerInfo.databaseName}`, 90, 40);
            doc.text(`Printed by: ${headerInfo.printedBy}`, 90, 45);

            doc.setFontSize(8);
            doc.text(`Page ${pageNumber}`, pageWidth - 10, 8, { align: "right" });

            doc.line(10, 52, pageWidth - 10, 52);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);

            let x = 10;
            doc.text("ID", x + 6, 56, { align: "center" }); x += 12;
            doc.text("Changed On", x + 18, 56, { align: "center" }); x += 36;
            doc.text("Changed By", x + 18, 56, { align: "center" }); x += 36;

            for (let i = 1; i <= 10; i++) {
                doc.text(`P${i}`, x + 9, 56, { align: "center" });
                x += 18;
            }

            doc.line(10, 58, pageWidth - 10, 58);
        }

        function drawRow(item, yPos) {
            let x = 10;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);

            const id = String(item.ID_Linear ?? '');
            const changedOn = String(item.changedOn ?? '');
            const changedBy = String(item.changedBy ?? '');

            doc.text(id, x + 6, yPos, { align: "center" }); x += 12;
            doc.text(changedOn, x + 1, yPos); x += 36;
            doc.text(changedBy, x + 1, yPos); x += 36;

            for (let i = 1; i <= 10; i++) {
                const value = String(item[`pump${i}`] ?? '');
                doc.text(value, x + 9, yPos, { align: "center" });
                x += 18;
            }
        }

        let pageNumber = 1;
        drawHeader(pageNumber);

        if (rows.length === 0) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text("No linear pumps history records found.", 10, y + 5);
        } else {
            rows.forEach((item) => {
                if (y > pageHeight - 15) {
                    doc.addPage('landscape');
                    pageNumber++;
                    drawHeader(pageNumber);
                    y = 64;
                }

                drawRow(item, y);
                y += rowHeight;
            });
        }

        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);

        const container = document.createElement('div');
        container.style.width = "100%";
        container.style.height = "100vh";
        container.style.display = "flex";
        container.style.flexDirection = "column";

        const backButton = document.createElement('button');
        backButton.textContent = "← Back";
        backButton.style = `
            background: #1976d2;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
            align-self: flex-start;
        `;
        backButton.onclick = () => {
            window.location.reload();
        };

        const iframe = document.createElement('iframe');
        iframe.src = pdfUrl;
        iframe.style.width = "100%";
        iframe.style.flex = "1";
        iframe.style.border = "none";

        container.appendChild(backButton);
        container.appendChild(iframe);
        document.body.innerHTML = "";
        document.body.appendChild(container);

    } catch (erro) {
        console.error("Falha ao gerar o PDF de histórico das linear pumps:", erro);
        alert("An Error Occured! Verify the console for more details.");
    }
}