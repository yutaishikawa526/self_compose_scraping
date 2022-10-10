
// self_compose_scrapingのデリゲートクラス
class delegate_self_compose_scraping {
    // スクレイピング終了を処理するクラス
    finish_scraping(result) { }
}

// 自身を配列として含む、スクレイピングを行うクラス
class self_compose_scraping extends delegate_self_compose_scraping{
    constructor(scraping_settings, delegate) {
        super();

        // スクレイピング結果を保持
        this.scraping_result = [];

        // デリゲートクラスを設定
        // delegate_self_compose_scrapingでないといけない
        this.delegate = delegate;

        // スクレイピング設定を保持
        // self_compose_scraping_settingでないといけない
        this.scraping_settings = scraping_settings;

        // 子要素のリザルトの回数
        this.child_result_count = 0;
        // 子要素のリザルトの最終的な回数
        this.child_result_max = 0;

        // スクレイピング子要素
        this.child_scraping = [];

        // iframeで使用するid
        this.iframe_id = 0;
    }

    // スクレイピングを実行
    do_scraping() {
        // スクレイピング
        let iframe = document.createElement('iframe');
        do{
            const RANDOM_MAX = 10000;
            this.iframe_id = Math.floor(Math.random() * RANDOM_MAX);
        }while(document.getElementById(String(this.iframe_id)) != null);
        iframe.id = String(this.iframe_id);
        let my_this = this;
        iframe.onload = function(){
            self_compose_scraping.finish_load_iframe(my_this);
        };
        let this_setting = my_this.scraping_settings[0];
        iframe.src = this_setting.target_url;
        iframe.width = 800;
        iframe.height = 500;
        document.body.appendChild(iframe);
    }

    // iframeのロードが終了したときに呼び出される
    static finish_load_iframe(my_this){
        // スクレイピングを実行
        let this_setting = my_this.scraping_settings[0];
        let html = document.getElementById(String(my_this.iframe_id)).contentWindow.document.getElementsByTagName("html")[0].cloneNode(true);
        let results = self_compose_scraping.get_scraping_results(html,this_setting);
        my_this.scraping_result.push(...results);

        // スクレイピング結果とスクレイピング設定から、子要素作成
        // または、結果を返す
        if (my_this.scraping_settings.length == 1) {
            my_this.delegate.finish_scraping(my_this.scraping_result);
        } else {
            let this_scraping_result = my_this.scraping_result.concat();
            my_this.scraping_result = [];
            my_this.child_result_count = 0;
            my_this.child_result_max = this_scraping_result.length;
            for (let i = 0; i < this_scraping_result.length; i++) {
                let next_url = this_scraping_result[i].result;
                let child_setting = my_this.scraping_settings.concat();
                child_setting.shift();
                child_setting[0].target_url = next_url;
                let child_scr = new self_compose_scraping(child_setting, my_this);
                my_this.child_scraping.push(child_scr);
                child_scr.do_scraping();
            }
        }
    }

    // html要素から、設定に対応した結果を取得する
    static get_scraping_results(html,this_setting){
        let results = [];
        let name_result = self_compose_scraping.get_Elemet_by_id_and_class(html,this_setting.target_name_class,this_setting.target_name_id);
        let target_result = self_compose_scraping.get_Elemet_by_id_and_class(html,this_setting.target_class,this_setting.target_id);
        let final_name = '';
        if(name_result.length != 0){
            let attribute_name = this_setting.result_name_attr;
            if(attribute_name == ''){
                final_name = name_result[0].textContent;
            }else{
                final_name = name_result[0].getAttribute(attribute_name);
            }
            if(final_name == null){
                final_name = '';
            }
        }
        for(let i=0;i<target_result.length;i++){
            let attribute_name = this_setting.result_attr;
            let target_attribute = '';
            if(attribute_name == ''){
                target_attribute = target_result[i].textContent;
            }else{
                target_attribute = target_result[i].getAttribute(attribute_name);
            }
            if(target_attribute == null || target_attribute == ''){
                continue;
            }
            results.push(new self_compose_scraping_result(final_name,target_attribute));
        }
        return results;
    }

    // idとクラス名を指定して要素を取得
    static get_Elemet_by_id_and_class(target_html,class_name,id_name){
        let valid_class_name = class_name != null && class_name != '';
        let valid_id_name = id_name != null && id_name != '';
        let result = [];
        if(valid_class_name && !valid_id_name){
            result = target_html.getElementsByClassName(class_name);
        }else if(!valid_class_name && valid_id_name){
            result = [target_html.getElementById(id_name)];
        }else if(valid_class_name && valid_id_name){
            let sub_re = target_html.getElementById(id_name);
            if(sub_re.className == class_name){
                result = [sub_re];
            }else{
                result = [];
            }
        }else{
            result = [];
        }
        return result;
    }

    // スクレイピング終了を処理するクラス
    finish_scraping(result) {
        for (let i = 0; i < result.length; i++) {
            this.scraping_result.push(result[i]);
        }
        this.child_result_count += 1;
        if (this.child_result_max == this.child_result_count) {
            this.delegate.finish_scraping(this.scraping_result);
        }
    }
}

// スクレイピング設定を保持
class self_compose_scraping_setting {
    constructor(target_url, target_class, target_id, result_attr, target_name_class, target_name_id, result_name_attr) {
        // 対象URL
        this.target_url = target_url;

        // スクレイピング対象の設定
        // 対象クラス
        this.target_class = target_class;
        // 対象id
        this.target_id = target_id;
        // 結果の属性
        // 空文字の場合、textContentを返す
        this.result_attr = result_attr;

        // スクレイピング結果に付与する名前設定
        // 対象クラス
        this.target_name_class = target_name_class;
        // 対象id
        this.target_name_id = target_name_id;
        // 結果の属性
        // 空文字の場合、textContentを返す
        this.result_name_attr = result_name_attr;
    }
}

// スクレイピング結果を格納
class self_compose_scraping_result {
    constructor(result_name, result) {

        // スクレイピング結果
        this.result = result;

        // スクレイピング結果に付与する名前
        this.result_name = result_name;
    }
}

// スクレイピングを行うエンジンクラス
class mainEngine extends delegate_self_compose_scraping{
    constructor(){
        super();
        document.head.innerHTML = '';
        document.body.innerHTML = '';

        let setting0 = new self_compose_scraping_setting(
            'https://~~~',
            'classname for target',
            'id for target',
            'href',
            'classname for name',
            'id for name',
            '');

        let setting = new self_compose_scraping_setting(
            'https://~~~',
            'classname for target',
            'id for target',
            'href',
            'classname for name',
            'id for name',
            '');
        let settings = [setting0,setting];
        let scraping = new self_compose_scraping(settings,this);
        scraping.do_scraping();
    }

    // スクレイピング終了を処理するクラス
    finish_scraping(result) {
        console.log(result);
    }
}

let start = new mainEngine();