Zotero.Signpost = {
	modifyLink : function(item) {
		if (item.getField("DOI")) {
			item.setField("url", "https://doi.org/" + item.getField("DOI"));
		}
	},

	isSignposted : function(item) {
      	for (i = 0; i < item.getAttachments().length; i++) {
        	var currAttach = Zotero.Items.get(item.getAttachments()[i.toString()]);
        	if (currAttach.getField("title").indexOf("ORCID") != -1) {
        		return true;
        	}
      	}
      	return false;
    },

	getAuthorOrcids : function(linkHdrText, responseText) {
		orcids = [];
		var start = 0;
		while (linkHdrText) {
			var currAuthor = linkHdrText.indexOf("rel=\"author\"", start);
			if (currAuthor === -1) {
				break;
			}
			var startOrcid = linkHdrText.lastIndexOf("http", currAuthor);
			var endOrcid = (linkHdrText.lastIndexOf(">;", currAuthor) != -1) 
							? linkHdrText.lastIndexOf(">;", currAuthor) 
							:linkHdrText.lastIndexOf(";", currAuthor) ;
			if (linkHdrText.slice(startOrcid, endOrcid).indexOf("orcid") != -1) {
				orcids.push(linkHdrText.slice(startOrcid, endOrcid));
			}
			start = currAuthor + 1;
		}
		return orcids;
	},

	setRequestProperties : function(req) {
      req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      req.setRequestHeader('Accept', 'application/vnd.orcid+xml');
      req.setRequestHeader('Authorization', 'Bearer f9dabfcf-d0de-40ed-bb2e-7111e5015b8e');
    },

	getAuthorName : function(fullOrcidUrl) {
		var orcidPattern = /[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{4}/
		var orcidIdStart = fullOrcidUrl.search(orcidPattern);
		var orcidId = fullOrcidUrl.slice(orcidIdStart, orcidIdStart + 19);
		var orcidReqUrl = "https://cors-anywhere.herokuapp.com/https://pub.sandbox.orcid.org/v2.0/" 
						  + orcidId +"/record";
		var req = Zotero.IaPusher.createCORSRequest("GET", orcidReqUrl, false);
		this.setRequestProperties(req);
		req.send();
		var authorNameStart = req.responseText.indexOf(">", 
							  req.responseText.indexOf("<personal-details:credit-name>")) + 1;
		var authorNameEnd = req.responseText.indexOf("</personal-details:", authorNameStart);

	
		return (authorNameStart < 1 || authorNameEnd < 1) ? null 
			   : req.responseText.slice(authorNameStart, authorNameEnd);
	},

	attachAuthorOrcids : function(linkHdrText) {
		var pane = Zotero.getActiveZoteroPane();
		var item = pane.getSelectedItems()[0];
		if (!linkHdrText || this.isSignposted(item)) {
			return;
		}
		var orcids = this.getAuthorOrcids(linkHdrText);
		for (var orcidUrl in orcids) {
			var authorName = this.getAuthorName(orcids[orcidUrl.toString()]);
			Zotero.Attachments.linkFromURL({
				url: orcids[orcidUrl.toString()],
				parentItemID: item.getField("id"),
				title: (authorName) ? authorName + "'s ORCID Profile" :"Author's ORCID Profile"
			});
		}
	},

	

	signpostEntry : function(linkText) {
		var pane = Zotero.getActiveZoteroPane();
		var item = pane.getSelectedItems()[0];
		this.modifyLink(item);
		this.attachAuthorOrcids(linkText);
	}
}