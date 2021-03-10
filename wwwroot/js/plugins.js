class Plugins{

	constructor(){
		this.defaultStyle = 'bold';
		this.defaultBox = 'nomal';
		this.panzoomResize = null;
		this.imageEdit = null;
		this.price = 150000;
		this.isForm = false;
		this.discount = {
			4 : 25,
			9 : 33,
			20 : 40
		}
		this.init();
	}

	ajax(url, params, succFunc){
		if(succFunc == undefined){
			succFunc = params;
			params = {};
		}
		var self = this;
		var options = {
			url : url,
			type : "POST",
			dataType : "json",
			data : params,
			success : function(result){
				if(typeof succFunc == 'function'){
					succFunc(result);
				}
			},
			error : function(error){
				console.log(error.responseText)
			}
		};
		if(self.isForm){
			options.contentType = false;
			options.processData = false;
			self.isForm = false;
		}
		$.ajax(options);
	}

	buildActiveStyle(){
		var self = this;
		var $dataStyle = $(".options_select_style").find("[data-style]");
		$dataStyle.each(function(){
			$(this).on('click', function(){
				$dataStyle.removeClass('active');
				this.classList.add('active');
				self.bindStyleForImage();
			});
		})

		$("[data-style='" + this.defaultStyle + "'][data-box='" + this.defaultBox + "']").click();
	}

	calcHeightBody(){
		var $header = $("#header");
		var $footer = $("#footer");
		var heightBody = "calc(100vh - " + ($header.innerHeight() + $footer.innerHeight()) + "px)";

		$("#bodyer").css({
			'height' : heightBody,
			'min-height' : heightBody,
			'max-height' : heightBody,
		});
	}

	bindOnChangeChooseImage(){
		var self = this;
		$("#input_upload_image").on('change', function(){
			var files = $.extend(true, {}, this.files);
			if(files.length > 0){
				self.renderImage(files);
			}
			this.value = '';
		});
	}

	async renderImage(files, index = 0){
		if(typeof files[index] == "undefined"){
			return;
		}

		var file = files[index];
		var $htmlPreview = $(".box_image.box_image_template").clone();
		var $img = $htmlPreview.find("img");
		$htmlPreview.removeClass('d-none box_image_template').addClass('box_preview_image');
		$(".box_image.box_choose_image").before($htmlPreview[0]);

		this.bindStyleForImage();

		await this.sleep(1000);

		var src = await this.uploadImageToServer(file);

		var sizeImage = await this.getSizeImage(src);

		if(sizeImage.width < sizeImage.height){
    		$img.css('width', '100%');
    	}else{
    		$img.css('height', '100%');
    	}

    	$img.attr('src', src).removeClass('img_loading_image');
    	this.renderNotification();
    	this.renderImage(files, ++index);
	}

	uploadImageToServer(file){
		var self = this;
		return new Promise(function(resolve){
			var formData = new FormData();
			formData.append("files", file);
			self.isForm = true;
			self.ajax('/attachment/upload', formData, function(res){
				resolve(res[0]);
			});
		});
	}

	getSizeImage(src){
		return new Promise(function(resolve){
			const img = new Image();
			img.onload = function() {
				return resolve({
					width : this.width,
					height : this.height
				});
			}
			img.src = src;
		})
	}

	copyBoxImage(){
		var $boxImage = $(".box_image");
		for(var i = 0; i< 10; i++){
			$boxImage.after($boxImage.clone())
		}
	}

	bindStyleForImage(){
		var $liActive = $(".options_select_style").find("li.active");
		var $boxImage = $("#area_image_upload").find(".box_image.box_preview_image");
		if($liActive.length <= 0){
			$liActive = $(".options_select_style").find("li:first-child");
			$liActive.addClass('active');
		}
		if($boxImage.length <= 0){
			return false;
		}
		var style = $liActive.attr('data-style');
		var boxStyle = $liActive.attr('data-box');
		$boxImage.each(function(){
			$(this).attr('data-style', style);
			$(this).attr('data-box', boxStyle);
		});
	}

	bindClickEditImage(){
		var configResize = this.configPanzoom();
		var self = this;
		$("#area_image_upload").on('click', ".box_image.box_preview_image", function(){
			var img = $(this).find('img');
			var src = img.attr('src');
			var style = img.attr('style');
			var typeStyle = $(this).attr('data-style');
			var typeBox = $(this).attr('data-box');
			var boxEditImage = $("#modalEditImage").find(".box-edit-image");
			var imgResize = boxEditImage.find("img.img_resize");

			var dataTranslate = $(this).attr("data-translate");
			var dataScale  = $(this).attr("data-scale");

			imgResize.attr('src', src).attr('style', style);
			boxEditImage.attr('data-style', typeStyle)
			boxEditImage.attr('data-box', typeBox)
			$("#modalEditImage").modal('show');

			self.imageEdit = $(this);

			self.panzoomResize = Panzoom(imgResize[0], configResize);
	        if(dataTranslate != undefined && dataScale != undefined){
	        	let trans = $.extend(true, {}, JSON.parse(dataTranslate))
	        	self.panzoomResize.zoom(parseFloat(dataScale), { animate: true })
	        	setTimeout(function(){
	        		self.panzoomResize.pan(Apps.roundUp(trans.x, 4), Apps.roundUp(trans.y, 4))
	        	});
	        }
	        var parentImage = imgResize[0].parentElement;
	        parentImage.addEventListener('wheel', self.panzoomResize.zoomWithWheel);
		});
		$("#modalEditImage").on("hide.bs.modal", function(){
			self.panzoomResize.destroy();
			self.imageEdit = null;
			self.panzoomResize = null;
		});
	}

	buildOriginImageResize(img){
		var box = img.parent();
		var windowWidth = $(window).width();
		var originX = 50;
		var originY = 50;
		var panzoomResize = this.panzoomResize;

		panzoomResize.pan(100000,-100000);

		var interval = setInterval(function(){
			var imgOffsetLeft = Math.round(img.offset().left);
			var boxOffsetLeft = Math.round(box.offset().left);
			if(imgOffsetLeft == boxOffsetLeft){
				return clearInterval(interval);
			}
			originX = imgOffsetLeft > boxOffsetLeft ? (originX + 1) : (originX - 1);
			img.css('transform-origin', originX + "% " + originY + "%")
		}, 500);
	}

	configPanzoom(){
		return {
			minScale: 0.5,
            maxScale: 4,
            contain: "outside",
            origin: "31% 50%"
		}
	}

	bindSaveImageEdited(){
		var self = this;
		$(".btn-done-edit-image").on('click', function(){
			var translate = self.panzoomResize.getPan();
			var scale = self.panzoomResize.getScale();
			self.imageEdit.find("img").css({
				'transform' : "translate(" + translate.x + "px, " + translate.y + "px)" + " scale(" + (scale * 0.83) + ")",
				'transform-origin' : "31% 31%"
			});
			self.imageEdit.attr('data-translate', JSON.stringify(translate)).attr('data-scale', scale)
			$("#modalEditImage").modal('hide')
		});
	}

	renderNotification(){
		var $notif = $("#notification");
		var numImage = this.countImage();
		var price = numImage * this.price;
		$notif.removeClass("d-none");
		$notif.find(".num-product").text(numImage);

		var lastDiscount = 0;
		for(var numImg in this.discount){
			let discount = this.discount[numImg];
			if(numImage >= numImg){
				lastDiscount = discount;
				continue;
			}
			break;
		}

		if(lastDiscount == 0){
			$notif.find(".price-discount").addClass('d-none');
			$notif.find(".temp_up_sale").addClass('d-none');
			$notif.find(".num-price").text(Apps.formatMoney(price) + "đ");
			return;
		}

		let priceDiscount = price - price * (lastDiscount / 100);
		$notif.find(".price-discount").removeClass('d-none').text(Apps.formatMoney(price) + "đ");
		$notif.find(".num-price").text(Apps.formatMoney(priceDiscount) + "đ");
		$notif.find(".temp_up_sale").removeClass('d-none').find('.congratulation').text(lastDiscount + "%");
	}

	countImage(){
		return $("#area_image_upload").find(".box_image.box_preview_image").length;
	}

	bindOpenModalBuy(){
		$("#btn_open_buy").on('click', function(){
			$("#modalBuy").modal("show");
		})
	}

	sleep(ms){
		return new Promise(function(resolve){
			setTimeout(resolve, ms);
		})
	}

	onReady(){
		this.calcHeightBody();
	}

	init(){
		this.bindOnChangeChooseImage();
		this.buildActiveStyle();
		this.bindStyleForImage();
		this.bindClickEditImage();
		this.bindSaveImageEdited();
		this.bindOpenModalBuy();

		let self = this;
		$(document).ready(function(){
			self.onReady();
		});
	}
}