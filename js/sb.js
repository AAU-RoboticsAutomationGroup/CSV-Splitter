var write_to_file = new Array();
var myArray_X = new Array();
var myArray_Y_sub = new Array();
var myArray_Y = new Array();
var excelRows = new Array();
var trace = new Array();
var selectedValues = new Array();
var selected_value_x = '';

// Set the options for x and y axis
function set_x_y(data) {
    // Display the x and y selection
    $('#select_x_y').css("display", "block");
    var $select_x = $('#x_axis');
    var $select_y = $('#y_axis');

    // Clear values of x and y (values that can be selected. The lists are cleared when loading a new file)
    $select_x.empty();
    $select_y.empty();

    // Set up the value from the csv or excel file
    for (var i = 0; i < data.length; i++) {
        $select_x.append('<option id="option' + i + '">' + data[i] + '</option>');
        $select_y.append('<option id="option' + i + '">' + data[i] + '</option>');
    }
    $('.selectpicker').selectpicker('refresh');
}

// Upload the file to process
function Upload() {
    // Reference the FileUpload element.
    var fileUpload = document.getElementById("fileUpload");

    // Validate whether File is valid Excel file.
    var regex = /^([a-zA-Z0-9\s_\\.\-:])+(.xls|.xlsx|.csv)$/;
    if (regex.test(fileUpload.value.toLowerCase())) {
        if (typeof (FileReader) != "undefined") {
            var reader = new FileReader();

            // For Browsers other than IE.
            if (reader.readAsBinaryString) {
                reader.onload = function (e) {
                    ProcessExcel(e.target.result);
                };
                reader.readAsBinaryString(fileUpload.files[0]);
            } else {
                // For IE Browser.
                reader.onload = function (e) {
                    var data = "";
                    var bytes = new Uint8Array(e.target.result);
                    for (var i = 0; i < bytes.byteLength; i++) {
                        data += String.fromCharCode(bytes[i]);
                    }
                    ProcessExcel(data);
                };
                reader.readAsArrayBuffer(fileUpload.files[0]);
            }
        } else {
            alert("This browser does not support HTML5.");
        }
    } else {
        alert("Please upload a valid CSV or Excel file.");
    }
};

// Process csv/excel data
function ProcessExcel(data) {
    // Read the Excel File data.
    var workbook = XLSX.read(data, {
        type: 'binary'
    });

    // Fetch the name of First Sheet.
    var firstSheet = workbook.SheetNames[0];

    // Read all rows from First Sheet into an JSON array.
    excelRows = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[firstSheet]);

    // Get the headers
    let columnHeaders = [];
    var worksheet = workbook.Sheets[firstSheet];
    for (let key in worksheet) {
        let regEx = new RegExp("^\(\\w\)\(1\){1}$");
        if (regEx.test(key) == true) {
            columnHeaders.push(worksheet[key].v);
        }
    }

    // Set x_axis, y_axis
    set_x_y(columnHeaders)

};

// Download csv file
function download_csv() {
    var csv = selected_value_x + ',' + selectedValues.join() + '\n';
    write_to_file.forEach(function (row, index) {
        csv += row.join(",") + "\n";
    });
    console.log(csv);
    var hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
    hiddenElement.target = '_blank';
    hiddenElement.download = 'data_output.csv';
    hiddenElement.click();
}

// Draw plot
function draw_image() {

    var graphDiv = document.getElementById('plotAreaDiv');

    // Get selected x axix header
    var e = document.getElementById("x_axis");
    selected_value_x = e.options[e.selectedIndex].value;

    // Get selected y axix headers
    var selectElement = document.getElementById('y_axis');
    selectedValues = Array.from(selectElement.selectedOptions).map(option => option.value);
    var len_y_selected = selectedValues.length;

    // Clear history data
    myArray_X = [];
    myArray_Y = [];
    myArray_Y_sub = [];
    trace = [];

    // Get x + y axix values
    for (var i = 0; i < excelRows.length; i++) {
        myArray_X[i] = excelRows[i][selected_value_x];
        for (var j = 0; j < len_y_selected; j++) {
            // alert(excelRows[i][selectedValues[j]]);
            myArray_Y_sub[j] = excelRows[i][selectedValues[j]];
        }
        myArray_Y[i] = myArray_Y_sub;
        myArray_Y_sub = [];
    }

    // Plot chart
    x = myArray_X;
    for (var j = 0; j < len_y_selected; j++) {
        var temp = myArray_Y.map(function (value, index) { return value[j]; });
        trace[j] = { x: x, y: temp, type: 'scatter', mode: 'lines', name: selectedValues[j] };
    }
    data = trace;
    layout = { title: 'Click-drag to select the data. Double click to reset view' };
    const config = {
        displayModeBar: false, // this is the line that hides the bar.
    };

    Plotly.newPlot(graphDiv, data, layout, config);

    // Event will be triggered if zoom in happened
    graphDiv.on('plotly_relayout',
        function (eventdata) {
            document.getElementById("downloadCSV").style.display = "block"
            write_to_file = [];
            if (typeof eventdata['xaxis.range[0]'] !== 'undefined') {
                for (var i = 0; i < myArray_X.length; i++) {
                    if ((Number(myArray_X[i]) >= eventdata['xaxis.range[0]']) && ((Number(myArray_X[i]) <= eventdata['xaxis.range[1]']))) {
                        write_to_file[i] = [myArray_X[i], myArray_Y[i]];
                    }
                }

            }
        });
};
