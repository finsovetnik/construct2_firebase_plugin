// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.plugins_, "cr.plugins_ not created");
/**
The main trick of mapping Firebase callbacks such as :

myDataRef.on('child_added', function(snapshot) {
  var message = snapshot.val();
});


Every callback type {Value, Child Added, Child Changed, Child Removed, Child Moved), is
associated with a callback dictionary indexed by dataRef

When a trigger condition e.g. onValue is evaluated, a proper Firebase ref is lazily created with an array

The trigger checks to see if the array is empty or not and pulls the entry out and fills out the data.

The actual firebase callback pushes data onto the array. 

This allows Firebase to push lots of data faster than C2 ticks, whilst only having as many listeners as we need

*/
/////////////////////////////////////
// Plugin class
cr.plugins_.Firebase = function(runtime)
{
	this.runtime = runtime;
};

(function ()
{
	var isNodeWebkit = false;
	var path = null;
	var fs = null;
	var nw_appfolder = "";
	
	var pluginProto = cr.plugins_.Firebase.prototype;
		
	/////////////////////////////////////
	// Object type class
	pluginProto.Type = function(plugin)
	{
		this.plugin = plugin;
		this.runtime = plugin.runtime;
	};

	var typeProto = pluginProto.Type.prototype;

	typeProto.onCreate = function()
	{
	};

	/////////////////////////////////////
	// Instance class
	pluginProto.Instance = function(type)
	{
		this.type = type;
		this.runtime = type.runtime;
		
		this.lastSnapshot = "";
		this.curTag = "";
		
		
		isNodeWebkit = this.runtime.isNodeWebkit;
		
		if (isNodeWebkit)
		{
			path = require("path");
			fs = require("fs");
			nw_appfolder = path["dirname"](process["execPath"]) + "\\";
		}
	};
	
	var instanceProto = pluginProto.Instance.prototype;
	
	var theInstance = null;
	
	instanceProto.onCreate = function()
	{
		theInstance = this;
		this.domain = this.properties[0];
	};
	
	
	/**BEGIN-PREVIEWONLY**/
	instanceProto.getDebuggerValues = function (propsections)
	{
		propsections.push({
			"title": "Firebase",
			"properties": [
				{"name": "Last data", "value": this.lastString, "readonly": true}
			]
		});
	};
	/**END-PREVIEWONLY**/

	//////////////////////////////////////
	// Conditions
	function Cnds() {};

	Cnds.prototype.Callback = function (tag)
	{
		console.log("trigger test", tag, this.curTag);
		return cr.equals_nocase(tag, this.curTag);
	};
	
	pluginProto.cnds = new Cnds();

	//////////////////////////////////////
	// Actions
	function Acts() {};

	Acts.prototype.SetString = function (ref_, val_)
	{		
		new Firebase(this.domain + ref_).set(String(val_));
	};
	
	Acts.prototype.SetJSON = function (ref_, val_)
	{		
		console.log(val_);
		new Firebase(this.domain + ref_).set(JSON.parse(val_));
	};
	
	Acts.prototype.SetNumber = function (ref_, val_)
	{		
		new Firebase(this.domain + ref_).set(Number(val_));
	};
	
	Acts.prototype.UpdateJSON = function (ref_, val_)
	{		
		new Firebase(this.domain + ref_).update(JSON.parse(val_));
	};		
	
	Acts.prototype.PushString = function (ref_, val_)
	{		
		new Firebase(this.domain + ref_).push(String(val_));
	};
	
	Acts.prototype.PushNumber = function (ref_, val_)
	{		
		new Firebase(this.domain + ref_).push(Number(val_));
	};
	
	Acts.prototype.PushJSON = function (ref_, val_)
	{		
		new Firebase(this.domain + ref_).push(JSON.parse(val_));
	};	
	
	Acts.prototype.Remove = function (ref_)
	{		
		new Firebase(this.domain + ref_).remove();
	};
	
	Acts.prototype.RegisterCallback = function (ref_, tag_, type_)
	{		
		var type = ["value", "child_added", "child_changed", "child_removed","child_moved"][type_]
		var self = this;
	
		var ref = new Firebase(this.domain + ref_).on(type, function(snapshot){
		
			console.log("callback ", type, tag_, ref_);
			self.lastSnapshot = snapshot;
			self.curTag = tag_;
			self.runtime.trigger(cr.plugins_.Firebase.prototype.cnds.Callback, self);
		});
		
	};
	
	pluginProto.acts = new Acts();

	//////////////////////////////////////
	// Expressions
	function Exps() {};

	Exps.prototype.ValString = function (ret)
	{	
		ret.set_string(String(this.lastSnapshot.val()));
	};
	
	Exps.prototype.ValJSON = function (ret)
	{	
		ret.set_string(JSON.stringify(this.lastSnapshot.val()));
	};
	
	Exps.prototype.ValNumber = function (ret)
	{	
		ret.set_float(this.lastSnapshot.val());
	};
	
	Exps.prototype.Ref = function (ret)
	{	
		ret.set_string(this.lastSnapshot.ref().toString().substring(this.domain.length-1));
	};
	
	pluginProto.exps = new Exps();
}());