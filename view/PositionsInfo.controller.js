sap.ui.controller("view.PositionsInfo",
{
	/**
	 * Called when a controller is instantiated and its View controls (if available) are already created.
	 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
	 *
	 * Funktion: initialisieren des posArr, counter und oModel
	 *
	 * @memberOf view.PositionsInfo
	 */
	onInit: function()
	{
		//Array setzen für posModel
		var posArr = [];
		sap.ui.getCore().byId("idPositionsInfo").data("posArr", posArr);

		//Counter initialisieren --> Counter für die Aufrufe der add funktion 
		var counter = 0;
		sap.ui.getCore().byId("idPositionsInfo").data("callCounter", counter);

		//Model für Positionen setzen 
		var oModel = new sap.ui.model.json.JSONModel();
		sap.ui.getCore().setModel(oModel, "posModel");
	},

	/**
	 * Aufruf: beim drücken des Zurück Buttons
	 * Funktion: Navigation zur Suche
	 */
	handleNavBack: function()
	{
		sap.ui.getCore().byId("App").back();
	},

	/** 
	 * Aufruf: EventHandler des Inputfeldes
	 * Funktion: wenn etwas in das Input-Feld eingegben wird, wird die setPrice Methode aufgerufen
	 *
	 * @param   {oControlEvent}   oEvt   --> daraus ermittelt man die eingegebene Menge
	 */
	onLiveChange: function(evt)
	{
		//Input Parameter ist die Menge 
		var input = parseInt(evt.getParameters().value);

		this.setPrice(input);
	},

	/** 
	 * Aufruf: von onLiveChange und positionUpdate
	 * Funktion: setzen des Preises zu einer eingegbenen Menge für das aktuelle Material
	 *
	 * @param   {Number}    input - eingegebene Menge
	 * @return  {Number}    newPrice - der neue Preis zur eingegben Menge
	 */
	setPrice: function(input)
	{
		//Überprüfung ob es ein gültiger int wert ist 
		if (isNaN(input) === true || input === " " || input < 1)
		{
			input = 1;
		}
		var actualPrice = parseFloat(sap.ui.getCore().byId("idDetail").data("actualPrice")).toFixed(2);

		//setzen des neuen Preises
		var newPrice = parseFloat(input * actualPrice).toFixed(2);

		this.getView().byId("idPriceText").setText(newPrice);
		sap.ui.getCore().byId("idDetail").data("newPrice", newPrice);

		return newPrice;
	},

	/**
	 * Aufruf: beim drücken des "Add to Cart"-Button
	 * Funktion: das aktuelle Material wird dem posModel hinzugefügt
	 */
	onPressAddBtn: function()
	{
		var qty = parseInt(this.byId("idMengeInput").getValue());

		if (isNaN(qty) === true || qty === "" || qty === " " || qty < 1)
		{
			this.byId("idMengeInput").setValue("");
			sap.m.MessageToast.show("Please enter a valid Number!");
		}
		else
		{
			//Hier wird gezählt wie oft eine Seite aufgerufen wird 
			var counter = sap.ui.getCore().byId("idPositionsInfo").data("callCounter");

			if (this.positionCheck(false) === false) //die Position gibt es noch nicht im posModel, also wurde noch nicht zur Cart hinzugefügt 
			{
				var actualModel = {
					"arktx": sap.ui.getCore().byId("idDetail").data("actualMaktx"),
					"kwmeng": qty,
					"preis": this.byId("idPriceText").getText(), //das ist der Preis mit der angegebenen Menge 
					"prsdt": this.byId("idDateText").getText(),
					"werks": this.byId("idWerkText").getText(),
					"matnr": sap.ui.getCore().byId("idDetail").data("actualMatnr"),
					"preisPerProduct": parseFloat(sap.ui.getCore().byId("idDetail").data("actualPrice")).toFixed(2)
				};

				var posArr = sap.ui.getCore().byId("idPositionsInfo").data("posArr");
				posArr.push(actualModel); //falls hier was nicht geht counterArr einführen 
				sap.ui.getCore().byId("idPositionsInfo").data("posArr", posArr);

				//brauch ich um den Daten einen Namen zu geben 
				var jsonModel = {
					"positions": posArr
				};
				var posModel = sap.ui.getCore().getModel("posModel");
				posModel.setData(jsonModel);
				console.log("posModel:");
				console.log(posModel);
			}
			else
			{
				this.positionUpdate(qty);
			}

			sap.ui.getCore().byId("idCart").getController().loadData();
			sap.ui.getCore().byId("App").to("idCart");
			this.byId("idMengeInput").setValue(""); //eins löschen 

			//Counter hoch zählen 
			counter++;
			sap.ui.getCore().byId("idPositionsInfo").data("callCounter", counter);

			//Value im View wieder löschen 
			this.getView().byId("idMengeInput").setValue("");
		}

	},

	/** 
	 * Aufruf: von onPressAddBtn im Detail.controller
	 * Funktion: laden der aktuellen Daten auf dem PositionsInfo-View
	 */
	getActualData: function()
	{
		//Daten holen und setzen 
		var actualMat = sap.ui.getCore().byId("idDetail").data("actualMatnr");
		var actualMaktx = sap.ui.getCore().byId("idDetail").data("actualMaktx");
		var actualPrice = sap.ui.getCore().byId("idDetail").data("actualPrice");

		console.log("PositionsInfo: actualMat = " + actualMat + " // actualMaktx = " + actualMaktx + " // actualPrice = " + actualPrice);

		var today = new Date();

		this.getView().byId("idSimpleForm").bindElement("Service>/MaraSet('" + actualMat + "')");
		this.getView().byId("idDateText").setText(today.toLocaleString());
		this.getView().byId("idWerkText").setText("ERKO");
		this.getView().byId("idMatnrText").setText(actualMat);
		this.getView().byId("idProductText").setText(actualMaktx);
		this.getView().byId("idPriceText").setText(actualPrice);

		//wenn es nicht 1 ist weil es das Produkt schon im Warenkorb gibt,
		//dann wird es im positionsCheck mit der aktuellen Menge überschrieben  
		this.getView().byId("idMengeInput").setValue("1");

		this.positionCheck(true);
	},

	/** 
	 * Aufruf: von getActualData und onPressAddBtn
	 * Funktion: Überprüfung ob es die Position schon im Cart gibt oder nicht
	 *
	 * @param   {boolean}   showMessage - boolean Wert ob eine Infonachricht gezeigt werden soll
	 * @return  {boolean}   result - boolean Wert ob es die Position schon im Cart gibt oder nicht
	 */
	positionCheck: function(showMessage)
	{
		var actualMat = sap.ui.getCore().byId("idDetail").data("actualMatnr");
		var result = false;

		//Hier wird gezählt wie oft eine Seite aufgerufen wird 
		var counter = parseInt(sap.ui.getCore().byId("idPositionsInfo").data("callCounter"));

		if (counter > 0) //weil erst dann darf ich die Überprüfung machen ob es schon einen Eintrag gibt. Das Model existiert erst wirklich wenn counter > 1 ist 
		{
			//Überprüfen ob es schon einen Eintrag zur aktuellen id gibt wenn ja dann Information anzeigen und qty neu setzen 
			var data = sap.ui.getCore().getModel("posModel").getData();

			for (var i = 0; i < data.positions.length; i++)
			{
				if (data.positions[i].matnr === actualMat)
				{
					if (showMessage === true)
					{
						sap.m.MessageToast.show("You've already added this material to your Cart. Please enter your new quantity!");
					}

					var qty = data.positions[i].kwmeng;
					this.getView().byId("idMengeInput").setValue(qty);

					var price = data.positions[i].preis;
					this.getView().byId("idPriceText").setText(price);

					result = true; //true weil er einen eintrag gefunden hat 
				}
			}
		}
		return result;
	},

	/** 
	 * Aufruf: von onPressAddBtn
	 * Funktion: updaten der Menge und des Preises im posModel, des aktuellen Materials
	 *
	 * @param   {Number}    qty - Menge um die es geupdated werden soll
	 */
	positionUpdate: function(qty) //Position der Aktuellen ID updaten 
	{
		//Hier wird gezählt wie oft eine Seite aufgerufen wird 
		var counter = parseInt(sap.ui.getCore().byId("idPositionsInfo").data("callCounter"));

		if (counter > 0) //weil erst dann darf ich die Überprüfung machen ob es schon einen Eintrag gibt. Das Model existiert erst wirklich wenn counter > 1 ist 
		{
			var actualMat = sap.ui.getCore().byId("idDetail").data("actualMatnr");
			var data = sap.ui.getCore().getModel("posModel").getData();

			for (var i = 0; i < data.positions.length; i++)
			{
				if (data.positions[i].matnr === actualMat)
				{
					//hier kann man eine Überprüfung machen wenn qty null ist dann auf null zurücksetzten und löschen
					data.positions[i].kwmeng = qty;
					data.positions[i].preis = this.setPrice(qty);
				}
			}
		}
	}

	/**
	 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
	 * (NOT before the first rendering! onInit() is used for that one!).
	 * @memberOf view.PositionsInfo
	 */
	//	onBeforeRendering: function() {
	//
	//	},

	/**
	 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
	 * This hook is the same one that SAPUI5 controls get after being rendered.
	 * @memberOf view.PositionsInfo
	 */
	// 	onAfterRendering: function()
	// 	{
	// 	}

	/**
	 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
	 * @memberOf view.PositionsInfo
	 */
	//	onExit: function() {
	//
	//	}

});