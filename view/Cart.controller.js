sap.ui.controller("view.Cart",
{
	/**
	 * Called when a controller is instantiated and its View controls (if available) are already created.
	 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
	 *
	 * Funktion: initialisieren des SalesOrder Models und des InputQty Fields
	 *
	 * @memberOf view.Cart
	 */
	onInit: function()
	{
		var sUrl = "/sap/opu/odata/sap/SALESORDERJUHA/";
		var oModel = new sap.ui.model.odata.ODataModel(sUrl, true, true);
		sap.ui.getCore().setModel(oModel, "SalesOrders");

		var oController = this;
		var oView = this.getView();

		//inputQty initialisieren 
		var oInputQty = new sap.m.Input("idInputQty",
		{
			value: "{posModel>kwmeng}",
			type: "Number",
			editable: false,
			liveChange: function(evt)
			{
				oController.onLiveChangeInput(evt);
			}
		});
		sap.ui.getCore().byId("idCart").data("oInputQty", oInputQty);

		if (sap.ui.Device.support.touch === true)
		{
			oView.byId("idDeleteIcon").setVisible(false);
			oView.byId("idCancelBtn").setVisible(false);
		}
		else
		{
			oView.byId("idHeaderToolbarTable").setActive(false);
		}
	},

	/**
	 * Aufruf: beim drücken des Add to Wishlist Buttons
	 * Funktion: Navigation zur Wishlist und laden der Daten
	 */
	onPressWishlistBtn: function()
	{
		sap.ui.getCore().byId("idWishlist").getController().loadData();
		sap.ui.getCore().byId("App").to("idWishlist");
		this.onPressCancelBtn();
	},

	/**
	 * Aufruf: beim drücken des Zurück Buttons
	 * Funktion: Navigation zur Suche und verschwinden des Confirm Buttons, nur wenn ein gültiger Input da ist
	 */
	handleNavBack: function()
	{
		var data = sap.ui.getCore().getModel("posModel").getData();
		var inputQty = sap.ui.getCore().byId("idCart").data("oInputQty");

		if (data.positions) //Wenn data.positions exisitert 
		{
			if (inputQty.getEditable() === true)
			{
				sap.m.MessageToast.show("Please confirm first!");
			}
			else
			{
				sap.ui.getCore().byId("App").to("idDetail");
			}
		}
		else
		{
			sap.ui.getCore().byId("App").to("idSearch");
		}
		this.onPressCancelBtn();
	},

	/** 
	 * Aufruf: beim drücken auf den "Order"-Button
	 * Funktion: öffnen des UploadDialogs
	 */
	onPressActionBtn: function()
	{
		var data = sap.ui.getCore().getModel("posModel").getData();
		var inputQty = sap.ui.getCore().byId("idCart").data("oInputQty");

		if (data.positions) //Wenn data.positions exisitert 
		{
			if (!data.positions[0])
			{
				sap.m.MessageToast.show("Your Cart is empty!");
			}
			else if (inputQty.getEditable() === true)
			{
				sap.m.MessageToast.show("Please confirm first!");
			}
			else
			{
				this._oDialog = sap.ui.xmlfragment("view.Fragment.UploadDialog", this);
				this.getView().addDependent(this._oDialog);
				this._oDialog.open();
			}
		}
		else
		{
			sap.m.MessageToast.show("Your Cart is empty!");
		}
	},

	/** 
	 * Aufruf: beim drücken auf den "Next"-Button nach dem Öffnen des Order-Dialogs
	 * Funktion: absenden der Order, wird im Backend gespeichert, beim Erfolg wird der Cart gelöscht
	 */
	onNextBtn: function()
	{
		var soModel = sap.ui.getCore().getModel("SalesOrders");
		var oView = this.getView();
		var oController = this;

		//Header
		var requestBody = {};
		requestBody.DocumentType = "ZEEC";
		requestBody.CustomerId = "0000000013";
		requestBody.SalesOrg = "ERKO";
		requestBody.DistChannel = "04";
		requestBody.Division = "01";

		var data = sap.ui.getCore().getModel("posModel").getData(); //data ist anscheinend keine wirkliche Referenz ?? 

		//Array mit den Matnr drin --> um sie nachher dann als gekauft zu kennzeichnen im WishlistSet 
		var matnrs = [];

		//Items Array
		var items = [];
		for (var i = 0; i < data.positions.length; i++)
		{
			var int = i + 1;
			var qty = parseFloat(data.positions[i].kwmeng).toFixed(3); //ist jetzt ein String --> parsen funktioniert im Frontend nicht 

			items.push(
			{
				Item: "0000" + int + "0",
				Material: data.positions[i].matnr,
				Description: data.positions[i].arktx,
				Plant: data.positions[i].werks,
				Quantity: qty, //und ist wieder ein Float --> ich brauche es im Format 1.000 
				UoM: "PCE"
			});

			matnrs.push(data.positions[i].matnr);
		}

		requestBody.SOItems = items; //SOItmes ist der navigation_name 

		//Sending request 
		soModel.create("/SOHeaders", requestBody, null,
			function(success)
			{
				//Dialog 
				var dialog = new sap.m.Dialog(
				{
					title: "Success",
					type: "Message",
					state: "Success",
					content: new sap.m.Text(
					{
						text: "Order, with OrderId " + success.OrderId + " ,has been successfully generated!"
					}),
					beginButton: new sap.m.Button(
					{
						text: "OK",
						press: function()
						{
							dialog.close();
							oController._oDialog.close();
						}
					})
				});

				dialog.open();

				//Daten löschen 
				//Array setzen für posModel
				var posArr = [];
				sap.ui.getCore().byId("idPositionsInfo").data("posArr", posArr);
				//data.positions.splice(0, data.length); --> geht nicht ?!

				var jsonModel = {
					"positions": posArr
				};

				var posModel = sap.ui.getCore().getModel("posModel");
				posModel.setData(jsonModel);

				//Table von den items unbinden 
				oView.byId("idCartTable").unbindItems();

				//callCounter auf null zurücksetzten 
				sap.ui.getCore().byId("idPositionsInfo").data("callCounter", 0);

				//Daten neu laden 
				sap.ui.getCore().byId("idPositionsInfo").getController().getActualData();
				oController.loadData();

				//Wishlist updaten 
				oController.updateWishlist(matnrs);

				sap.ui.getCore().byId("App").to("idCart");
			},
			function(error)
			{
				console.log(error);

				var dialog = new sap.m.Dialog(
				{
					title: "Error",
					type: "Message",
					state: "Error",
					content: new sap.m.Text(
					{
						text: "An Error occured! Please try again later."
					}),
					beginButton: new sap.m.Button(
					{
						text: "OK",
						press: function()
						{
							dialog.close();
							oController._oDialog.close();
						}
					})
				});
			});

		this.onClose();
	},

	/** 
	 * Aufruf: von onNextBtn
	 * Funktion: updaten der Wishlist im Backend --> senden des Update-Requests
	 *
	 * @param   {Array} matnrs - Liste der Materialnummern in der Order
	 */
	updateWishlist: function(matnrs)
	{
		var maModelData = sap.ui.getCore().getModel("maModel").getData().materials;
		var actualMat = 0;

		for (var i = 0; i < matnrs.length; i++)
		{
			for (var x = 0; x < maModelData.length; x++) //Da gibt es theoretisch nur einen Wert oder gar keinen 
			{
				if (matnrs[i] === maModelData[x].matnr && maModelData[x].inWishlist === true)
				{
					actualMat = matnrs[i];
				}
			}

			if (actualMat !== 0) //Wenn ein Wert gefunden wurde 
			{
				var oModel = sap.ui.getCore().getModel("Service");

				var requestBody = {
					Kunnr: "13",
					Matnr: actualMat
					//Der Rest wird im Backend gesetzt 
				};

				oModel.update("/WishlistSet(Kunnr='" + 13 + "',Matnr='" + actualMat + "')", requestBody, null,
					function(success)
					{
						//Neuladen der DAten 
						console.log("Wishlist wurde geupdated: " + success);
						sap.ui.getCore().byId("idSearch").getController().loadData(); //lädt die Daten in idDetail auch neu 
						//	sap.ui.getCore().byId("idDetail").getController().getActualData();
					},
					function(error)
					{
						console.log("Fehler beim updaten der Wishlist: " + error);
					});
			}
		}

	},

	/** 
	 * Aufruf: beim drücken auf den SalesOrderShow-Button
	 * Funktion: öffnen des HeadersDialogs und binden der Tabelle des HeadersDialogs an das SalesOrder Model
	 */
	onPressSalesOrderBtn: function()
	{
		//_oDialog ist eine Instanzvariable, wird hier initialisiert 
		this._oDialog = sap.ui.xmlfragment("view.Fragment.HeadersDialog", this);

		this.getView().addDependent(this._oDialog);
		this._oDialog.bindItems(
		{
			path: "SalesOrders>/SOHeaders",
			template: new sap.m.ColumnListItem(
			{
				type: "Active",
				cells: [
					new sap.m.Text(
					{
						text: "{SalesOrders>OrderId}"
					}),
				    new sap.m.Text(
					{
						text: "{SalesOrders>DocumentType}"
					}),
				    new sap.m.Text(
					{
						text: "{SalesOrders>DocumentDate}"
					}),
				    new sap.m.Text(
					{
						text: "{SalesOrders>CustomerId}"
					}),
				    new sap.m.Text(
					{
						text: "{SalesOrders>SalesOrg}"
					}),
				    new sap.m.ObjectNumber(
					{
						number: "{SalesOrders>OrderValue}",
						unit: "{SalesOrders>Currency}"
					})
				]
			})
		});

		//lässt das SearchField verschwinden 
		this._oDialog._searchField.setVisible(false);
		this._oDialog._oSubHeader.setVisible(false);

		this._oDialog.open();
	},

	/** 
	 * Aufruf: vom HeadersDialog, UploadDialog und ItemsDialog
	 * Funktion: schließen des Aktuellen _oDialog
	 */
	onClose: function()
	{
		sap.ui.getCore().byId("App").to("idCart"); //--> evtl weglassen 
		this._oDialog.close();
	},

	/** 
	 * Aufruf: vom HeadersDialog
	 * Funktion: öffnen des ItemsDialogs und binden der Tabelle des ItemsDialogs an das SalesOrder Model
	 *
	 * @param   {oControlEvent}   evt
	 */
	onConfirm: function(evt) //wird nur von dem HeadersDialog aufgerufen 
	{
		var context = evt.getParameter("selectedContexts").toString(); // /SOHeaders('XXX')

		//_oDialog ist eine Instanzvariable, wird hier initialisiert 
		this._oDialog = sap.ui.xmlfragment("view.Fragment.ItemsDialog", this);

		this.getView().addDependent(this._oDialog);
		this._oDialog.bindItems(
		{
			path: "SalesOrders>" + context + "/SOItems", //ich brauche hier kein expand weil ich ja den Header hier nicht will 
			template: new sap.m.ColumnListItem(
			{
				type: "Inactive",
				cells: [
					new sap.m.Text(
					{
						text: "{SalesOrders>OrderId}"
					}),
				    new sap.m.Text(
					{
						text: "{SalesOrders>Item}"
					}),
				    new sap.m.Text(
					{
						text: "{SalesOrders>Material}"
					}),
				    new sap.m.Text(
					{
						text: "{SalesOrders>Description}"
					}),
				    new sap.m.Text(
					{
						text: "{SalesOrders>Plant}"
					}),
					new sap.m.Text(
					{
						text: "{SalesOrders>Quantity}"
					}),
				    new sap.m.Text(
					{
						text: "{SalesOrders>UoM}"
					}),
				    new sap.m.ObjectNumber(
					{
						number: "{SalesOrders>Value}"
					})
				]
			})
		});

		//lässt das SearchField verschwinden 
		this._oDialog._searchField.setVisible(false);
		this._oDialog._oSubHeader.setVisible(false);

		//Columns nicht klickbar machen 
		this._oDialog._table.setMode("None");

		this._oDialog.open();
	},

	/** 
	 * Aufruf: von HeadersDialog und ItemsDialog
	 * Funktion: filtern der Tabelle
	 *
	 * @param   {oControlEvent}   oEvt
	 */
	/*	onSearch: function(oEvt) 
	{
		var sValue = oEvt.getParameter("value");
		var oFilter = new sap.ui.model.Filter("OrderId", sap.ui.model.FilterOperator.Contains, sValue);
		var oBinding = oEvt.getSource().getBinding("items");
		oBinding.filter([oFilter]);
			// add filter for search
		var filters = [];
		var entry = oEvt.getParameters().value;
		var oFilter;

		//wenn etwas einegegben wird werden neue Filter gesetzt und danach gesucht ob es den eintrag gibt --> in der Matnr oder der Maktx, bezogen auf das gesetzte Model 
		if (entry && entry.length > 0)
		{
			var filter = new sap.ui.model.Filter("OrderId", sap.ui.model.FilterOperator.Contains, entry);
			//var filterMaktx = new sap.ui.model.Filter("maktx", sap.ui.model.FilterOperator.Contains, entry);
			filters.push(filter);
			//filters.push(filterMaktx);

			oFilter = new sap.ui.model.Filter(filters, false); //mit false wird die oder Funktion ausgewählt 
		}

		// update list binding --> um das Ergbenis der Suche darzustellen 
		var binding = oEvt.getSource().getBinding("items");
		console.log(binding);
		binding.filter(oFilter, "Control");
	},*/

	/**
	 * Aufruf: beim drücken des Logout Buttons
	 * Funktion: Aufruf von logout()
	 */
	onPressLogBtn: function()
	{
		sap.ui.getCore().byId("idLogon").getController().logout();
	},

	/** 
	 * Aufruf: beim drücken des "Shop more" Buttons
	 * Funktion: Navigation zu Search.view und verschwinden des Confirm Buttons
	 */
	onPressShopMoreBtn: function()
	{
		var data = sap.ui.getCore().getModel("posModel").getData();
		var inputQty = sap.ui.getCore().byId("idCart").data("oInputQty");

		if (data.positions) //Wenn data.positions exisitert muss es die Prüfung machen ob es ein gültigen Wert in InputQty gibt 
		{
			if (inputQty.getEditable() === true)
			{
				sap.m.MessageToast.show("Please confirm first!");
			}
			else
			{
				sap.ui.getCore().byId("App").to("idSearch");
			}
		}
		else //sonst wird einfach zu Search navigiert 
		{
			sap.ui.getCore().byId("App").to("idSearch");
		}
		this.onPressCancelBtn();
	},

	/** 
	 * Aufruf: von onPressAddBtn im PositionsInfo.controller und onDeleteItem
	 * Funktion: binden der Tabelle an des posModel und berechnen des Gesamtpreises
	 *           (wird nur dann aufgerufen wenn was am posModel verändert wurde)
	 */
	loadData: function()
	{
		var data = sap.ui.getCore().getModel("posModel").getData();
		// this.getView().byId("idCartTable").bindElement("posModel>/positions"); 
		var oCartTable = this.getView().byId("idCartTable");
		var inputQty = sap.ui.getCore().byId("idCart").data("oInputQty");

		oCartTable.bindItems(
		{
			path: "posModel>/positions", //wird ans posModel gebunden --> braucht man für die Suche 
			template: new sap.m.ColumnListItem(
			{
				type: "Active",
				cells: [
				new sap.m.ObjectIdentifier(
					{
						title: "{posModel>matnr}",
						text: "{posModel>arktx}"
					}),
				new sap.m.Text(
					{
						text: "{posModel>werks}"
					}),
				new sap.m.Text(
					{
						text: "{posModel>prsdt}"
					}),
				inputQty,
				new sap.m.ObjectNumber(
					{
						number: "{posModel>preis}",
						unit: "€"
					})
				]
			})
		});

		console.log(oCartTable);

		if (!data.positions[0]) //wenn es keine Daten im Warenkrob gibt 
		{
			//setzt die Number auf 0, wenn noch Artikel im Warenkorb sind wird der Gesamtpreis bei loadData() berechnet 
			//wenn nicht bleibt es bei 0, weil es dann keinen Wert für data.positions[0] findet 
			this.getView().byId("idTextTotalPrice").setNumber(0.00);
		}
		else
		{
			//Berchnen des Total Prices 
			var totalPrice = parseFloat(data.positions[0].preis); //toFixed converts it to a string 

			//er geht hier nur rein wenn die length größer als 1 ist 
			for (var i = 1; i < data.positions.length; i++)
			{
				totalPrice += parseFloat(data.positions[i].preis);
			}

			console.log("Total Price = " + totalPrice);
			this.getView().byId("idTextTotalPrice").setNumber(parseFloat(totalPrice).toFixed(2));
		}
	},

	/** 
	 * Aufruf: beim drücken auf einen Eintrag in der Tabelle
	 * Funktion: setzten der aktuellen Werte mit dem gewählten Eintrag und Navigation zum Detail.view
	 *
	 * @param   {oControlEvent}   evt
	 */
	onItemPress: function(evt)
	{
		//console.log(evt.getParameters("selectedContexts").toString());

		//Um die Position im Array herauszufinden gibt es evtl eine einfachere Lösung über den sPath 
		var oListItem = evt.getParameters().listItem;
		var value = this.getPosition(oListItem);

		//Aktuelle Datan aus dem Model auslesen --> value ist die Position im Model 
		var data = sap.ui.getCore().getModel("posModel").getData();

		var actualMat = data.positions[value].matnr;
		var actualMatx = data.positions[value].arktx;
		var actualZPrice = data.positions[value].preisPerProduct; //ich brauche den Preis für ein Produkt 

		//aktuelle Matrialnummer und Bezeichnung wird gespeichert 
		sap.ui.getCore().byId("idDetail").data("actualMatnr", actualMat);
		sap.ui.getCore().byId("idDetail").data("actualMaktx", actualMatx);
		sap.ui.getCore().byId("idDetail").data("actualPrice", actualZPrice);

		//aktuelle Daten beim nächsten View eintragen 
		sap.ui.getCore().byId("idDetail").getController().getActualData();
		sap.ui.getCore().byId("App").to("idDetail");
	},

	/** 
	 * Aufruf: von onItemPress und onDeleteItem und onLiveChangeInput
	 * Funktion: aus dem listItem die Position im Array herausfinden --> geht nur für ein Array unter einer Länge von Hundert
	 *
	 * @param   {listItem}  oListItem - listItem Object
	 * @return  {int}       value     - position im Array
	 */
	getPosition: function(oListItem)
	{
		var id = oListItem.getId();
		var testString = id.substr(id.length - 2); //geht dann bis zum Ende 
		var value;

		if (isNaN(testString) === true) //wenn es keine Zahl ist soll er es nur mit der letzten stelle versuchen --> id <= 9 
		{
			value = id.charAt(id.length);
		}
		else //id > 9 
		{
			value = id.substr(id.length - 1);
		}

		return value;
	},

	/** 
	 * Aufruf: beim drücken auf das Delete Icon
	 * Funktion: setzten des Modes der Tabelle auf "Delete" und anzeigen des "Cancel"-Buttons
	 */
	onPressDeleteBtn: function()
	{
		var data = sap.ui.getCore().getModel("posModel").getData();
		var oCartTable = this.getView().byId("idCartTable");

		if (data.positions) //Wenn data.positions exisitert 
		{
			if (!data.positions[0])
			{
				sap.m.MessageToast.show("Your Cart is empty!");
			}
			else
			{
				if (oCartTable.getMode() === sap.m.ListMode.Delete)
				{
					this.onPressCancelBtn();
				}
				else
				{
					oCartTable.setMode("Delete"); //Mode der Tabelle auf Delete setzten --> Buttons erscheinen 
					oCartTable.setSwipeDirection("LeftToRight"); //Swipe Direction ändern für's canceln 

					if (sap.ui.Device.support.touch === false)
					{
						var cancelBtn = this.getView().byId("idCancelBtn");
						cancelBtn.setEnabled(true);
						cancelBtn.setVisible(true);
					}
				}
			}
		}
		else
		{
			sap.m.MessageToast.show("Your Cart is empty!");
		}
	},

	/** 
	 * Aufruf: beim drücken des löschen Buttons
	 * Funktion: löschen des Items im posModel und verstecken des "Cancel"-Buttons
	 *
	 * @param   {oControlEvent}   evt
	 */
	onDeleteItem: function(evt)
	{
		var oListItem = evt.getParameters().listItem;
		var value = this.getPosition(oListItem);
		var data = sap.ui.getCore().getModel("posModel").getData();

		data.positions.splice(value, 1); //value ist die Position die gelöscht werden soll,
		//1 bedeutet dass nur eins gelöscht werden soll  

		this.onPressCancelBtn();

		//Daten im Cart neu laden 
		this.loadData();
	},

	/** 
	 * Aufruf: beim drücken des "Cancel"-Buttons
	 * Funktion: setzen des Modes der Tabelle auf "None" und verstecken des "Cancel"-Buttons
	 */
	onPressCancelBtn: function()
	{
		var oCartTable = this.getView().byId("idCartTable");
		oCartTable.setMode("None");
		oCartTable.setSwipeDirection("RightToLeft");

		var cancelBtn = this.getView().byId("idCancelBtn");
		cancelBtn.setEnabled(false);
		cancelBtn.setVisible(false);
	},

	/** 
	 * Aufruf: beim drücken des Edit-Buttons
	 * Funktion: bearbeiten der input Felder ermöglichen und anzeigen des "Confrim"-Buttons
	 */
	onPressEditBtn: function()
	{
		var data = sap.ui.getCore().getModel("posModel").getData();

		if (data.positions) //Wenn data.positions exisitert 
		{
			if (!data.positions[0])
			{
				sap.m.MessageToast.show("Your Cart is empty!");
			}
			else
			{
				//Input einschalten --> value wird automatisch übernommen 
				var inputQty = sap.ui.getCore().byId("idCart").data("oInputQty");
				inputQty.setEditable(true);
				this.loadData(); //um die inputQty bei allen zu aktualisieren 

				var confirmBtn = this.getView().byId("idConfirmBtn");
				confirmBtn.setEnabled(true);
				confirmBtn.setVisible(true);
			}
		}
		else
		{
			sap.m.MessageToast.show("Your Cart is empty!");
		}
	},

	/** 
	 * Aufruf: Beim drücken des "Confirm"-Buttons
	 * Funktion: Überprüfen des Inputs, Bearbeiten-Funktion ausschalten der InputQty und verstecken des "Confirm"-Buttons
	 */
	onPressConfirmBtn: function()
	{
		var data = sap.ui.getCore().getModel("posModel").getData();
		var commit = true;

		if (data.positions[0]) //Wenn data.positions einen Eintrag hat 
		{
			//Wenn bei irgendeiner Position die Menge nicht passt wird commit auf false gesetzt und es geht nicht weiter 
			for (var i = 0; i < data.positions.length; i++)
			{
				var qty = parseInt(data.positions[i].kwmeng);
				if (isNaN(qty) === true || qty === " " || qty < 1)
				{
					sap.m.MessageToast.show("Please enter valid Number!");
					commit = false;
				}
			}

			if (commit === true) //Wenn alles okay ist wird alles neu geladen und Aktionen durchgeführt 
			{
				var confirmBtn = this.getView().byId("idConfirmBtn");
				confirmBtn.setEnabled(false);
				confirmBtn.setVisible(false);

				var inputQty = sap.ui.getCore().byId("idCart").data("oInputQty");
				inputQty.setEditable(false);

				this.loadData();
			}
		}
		return commit;
	},

	/** 
	 * Aufruf: wenn etwas in das Input Feld eingegeben wird
	 * Funktion: setzen des aktuellen Preises, angezeigt wird
	 *           es erst beim drücken auf confirm, oder beim bearbeiten des nächsten Input Feldes
	 *
	 * @param   {oControlEvent} - evt
	 */
	onLiveChangeInput: function(evt)
	{
		var valueNew = parseInt(evt.getParameters().value);
		var i = this.getPosition(evt.getSource());
		console.log(evt.getSource());
		var data = sap.ui.getCore().getModel("posModel").getData();

		if (isNaN(valueNew) === true || valueNew === " " || valueNew < 1)
		{
			console.log("Qty Input invalid");
		}
		else
		{
			data.positions[i].preis = parseFloat(valueNew * data.positions[i].preisPerProduct).toFixed(2);
			data.positions[i].kwmeng = valueNew;
		}
	},

	/**
	 * Aufruf: beim drücken des Statistics Buttons
	 * Funktion:
	 */
	onPressStatisticsBtn: function()
	{
		this._oDialog = sap.ui.xmlfragment("view.Fragment.StatisticsDialog", this);
		this.getView().addDependent(this._oDialog);
		var percentage;

		sap.ui.getCore().loadLibrary("sap.viz");
		var oVizFrame = new sap.viz.ui5.controls.VizFrame(
		{
			vizType: "pie",
			uiConfig: "{applicationSet:'fiori'}"
		});

		//nur um die prozentzahl herausfzufinden
		var oStatisticsModel = new sap.ui.model.json.JSONModel().attachRequestCompleted(
			function(oData)
			{
				//Daten des Statistics Entity Sets 
				var oStatistics = oData.getSource().getProperty("/d");
				percentage = oStatistics.ProzentTotal;

				var oDatasetModel = {
					"dataset": [
						{
							Bought: "Bought Products",
							Percentage: parseFloat(percentage).toFixed(2)
            				},
						{
							Bought: "Still on Wishlist",
							Percentage: parseFloat(100 - percentage).toFixed(2)
				            }
    		            ]
				};

				var oModel = new sap.ui.model.json.JSONModel(oDatasetModel);

				var oDataset = new sap.viz.ui5.data.FlattenedDataset(
				{
					dimensions: [
						{
							axis: 1,
							name: "Bought",
							value: "{Bought}"
							}
						],
					measures: [
						{
							name: "Percentage",
							value: "{Percentage}"
							}
			    		],
					data:
					{
						path: "/dataset"
					}
				});

				oVizFrame.setDataset(oDataset);
				oVizFrame.setModel(oModel);

				var feedSize = new sap.viz.ui5.controls.common.feeds.FeedItem(
				{
					uid: "size",
					type: "Measure",
					values: ["Percentage"]
				});
				var feedColor = new sap.viz.ui5.controls.common.feeds.FeedItem(
				{
					uid: "color",
					type: "Dimension",
					values: ["Bought"]
				});
				oVizFrame.addFeed(feedSize);
				oVizFrame.addFeed(feedColor);

				oVizFrame.setVizProperties(
				{
					legend:
					{
						title:
						{
							visible: false
						}
					},
					title:
					{
						visible: false
					}
				});
			});
		oStatisticsModel.loadData("/sap/opu/odata/sap/ZCS_APP_SRV/StatisticsSet(Matnr='')?$format=json");

		this._oDialog.addContent(oVizFrame);
		this._oDialog.data("oVizFrame", oVizFrame);
		this._oDialog.setVerticalScrolling(false);
		this._oDialog.open();
	},

	onPressShowTableBtn: function()
	{
		this._oDialog.close();
		this._oDialog = sap.ui.xmlfragment("view.Fragment.StatisticsDialog", this);
		this.getView().addDependent(this._oDialog);
		//Chart entfernen
		this._oDialog.removeContent(this._oDialog.data("oVizFrame"));
		var maModelData = sap.ui.getCore().getModel("maModel").getData().materials;

		var oList = new sap.m.List();

		var oModel = new sap.ui.model.json.JSONModel().attachRequestCompleted(
			function(oData)
			{
				var oStatistics = oData.getSource().getProperty("/d/results");

				for (var i = 0; i < oStatistics.length; i++)
				{
					//Herausfinden welche Produkte schon gekauft worden sind in der Wishlist 
					if (oStatistics[i].Gekauft === "X")
					{
						var matnr = parseInt(oStatistics[i].Matnr);
						var position = sap.ui.getCore().byId("idDetail").getController().getMatPosition(matnr);

						oList.addItem(
							new sap.m.ObjectListItem(
							{
								title: maModelData[position].maktx,
								intro: maModelData[position].matnr,
								icon: "sap-icon://course-book"
							}));
					}
				}
			});
		oModel.loadData("/sap/opu/odata/sap/ZCS_APP_SRV/StatisticsSet?$format=json");
		this._oDialog.addContent(oList);

		var oTitle = this._oDialog.getContent()[0].getContent()[0];
		oTitle.setText("Bought Items from Wishlist");

		var oTableBtn = this._oDialog.getContent()[0].getContent()[2];
		oTableBtn.setVisible(false);

		var oChartBtn = this._oDialog.getContent()[0].getContent()[3];
		oChartBtn.setVisible(true);

		this._oDialog.setVerticalScrolling(true);
		this._oDialog.open();
	},

	onPressShowChartBtn: function()
	{
		this._oDialog.close();
		this.onPressStatisticsBtn();
	}

	/**
	 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
	 * (NOT before the first rendering! onInit() is used for that one!).
	 * @memberOf view.Cart
	 */
	//	onBeforeRendering: function() {
	//
	//	},

	/**
	 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
	 * This hook is the same one that SAPUI5 controls get after being rendered.
	 * @memberOf view.Cart
	 */
	//	onAfterRendering: function() {
	//
	//	},

	/**
	 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
	 * @memberOf view.Cart
	 */
	//	onExit: function() {
	//
	//	}

});