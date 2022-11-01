
// self_compose_scrapingのデリゲートクラス
class delegate_self_compose_scraping {
    // スクレイピング終了を処理するクラス
    finish_scraping(result) {}

    // スクレイピングの共通化処理を行う
    unify_scraping_result(result,next_setting){}
}

// 自身を配列として含む、スクレイピングを行うクラス
class self_compose_scraping extends delegate_self_compose_scraping{
    constructor(scraping_settings,delegate,is_top = false) {
        super();

        // 先頭のself_compose_scrapingであるか
        this.is_top = is_top;

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
        let global_this = this;
        iframe.onload = function(){
            global_this.finish_load_iframe();
        };
        let this_setting = this.scraping_settings[0];
        iframe.src = this_setting.target_url;
        iframe.width = 800;
        iframe.height = 500;
        document.body.appendChild(iframe);
    }

    // iframeのロードが終了したときに呼び出される
    finish_load_iframe(){
        // スクレイピングを実行
        let this_setting = this.scraping_settings[0];
        let html = document.getElementById(String(this.iframe_id)).contentWindow.document.getElementsByTagName("html")[0].cloneNode(true);
        let results = this.get_scraping_results(html,this_setting);
        this.scraping_result.push(...results);
        document.getElementById(String(this.iframe_id)).remove();

        // スクレイピング結果とスクレイピング設定から、子要素作成
        // または、結果を返す
        if (this.scraping_settings.length == 1) {
            if(this_setting.is_same_delete){
                // 共通化処理
                this.remove_duplicate_values(true);
            }
            this.delegate.finish_scraping(this.scraping_result);
        } else {
            if(this_setting.is_same_delete){
                if(this.is_top){
                    // 共通化処理
                    this.remove_duplicate_values(false);
                    // 新しく子を作成する
                    this.create_child_from_result_setting();
                }else{
                    // 共通内容を統一
                    let child_setting = this.scraping_settings.concat();
                    this.delegate.unify_scraping_result(this.scraping_result,child_setting);
                }
            }else{
                this.create_child_from_result_setting();
            }
        }
    }

    // リザルトと設定から子を作成し、スクレイピングを継続する
    create_child_from_result_setting(){
        let this_scraping_result = this.scraping_result.concat();
        this.scraping_result = [];
        this.child_result_count = 0;
        this.child_result_max = this_scraping_result.length;
        for (let i = 0; i < this_scraping_result.length; i++) {
            let next_url = this_scraping_result[i].result;
            let child_setting = this.scraping_settings.concat();
            child_setting.shift();
            child_setting[0].target_url = next_url;
            let child_scr = new self_compose_scraping(child_setting, this);
            this.child_scraping.push(child_scr);
            child_scr.do_scraping();
        }
    }

    // スクレイピング結果から重複を削除する
    remove_duplicate_values(consider_result_name){
        let buff_result = this.scraping_result.concat();
        this.scraping_result = [];
        for(let i=0;i<buff_result.length;i++){
            let buff = buff_result[i];
            let already = false;
            for(let j=0;j<this.scraping_result.length;j++){
                let res = this.scraping_result[j];
                if(buff.result == res.result && (!consider_result_name || buff.result_name == res.result_name)){
                    already = true;
                    break;
                }
            }
            if(!already){
                this.scraping_result.push(buff);
            }
        }
    }

    // html要素から、設定に対応した結果を取得する
    get_scraping_results(html,this_setting){
        let results = [];
        let name_result = this.get_Elemet_by_id_and_class(html,this_setting.target_name_class,this_setting.target_name_id);
        let target_result = this.get_Elemet_by_id_and_class(html,this_setting.target_class,this_setting.target_id);
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
    get_Elemet_by_id_and_class(target_html,class_name,id_name){
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

    // スクレイピングの共通化処理を行う
    unify_scraping_result(result,next_setting){
        if(!this.is_top){
            // 子の結果を回収
            for (let i = 0; i < result.length; i++) {
                this.scraping_result.push(result[i]);
            }
            this.child_result_count += 1;
            if (this.child_result_max == this.child_result_count) {
                this.delegate.unify_scraping_result(this.scraping_result,next_setting);
            }
            return;
        }
        // トップ階層なので、共通化処理を行う
        for (let i = 0; i < result.length; i++) {
            this.scraping_result.push(result[i]);
        }
        this.child_result_count += 1;
        if (this.child_result_max == this.child_result_count) {
            this.scraping_settings = next_setting;
            // 共通化処理
            this.remove_duplicate_values(false);
            // 新しく子を作成する
            this.create_child_from_result_setting();
        }
    }
}

// スクレイピング設定を保持
class self_compose_scraping_setting {
    constructor(target_url, target_class, target_id, result_attr, target_name_class, target_name_id, result_name_attr,is_same_delete) {
        // 対象URL
        this.target_url = target_url;
        // 被っていたら共通化するか
        this.is_same_delete = is_same_delete;

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

        let settings = [];
        let targetUrlInput = window.prompt('ターゲットとなる最初の階層のurlを設定してください。', '');
        let targetHierarchy = window.prompt('最初のページから目的のページまでの階層を入力してください。', '');
        targetHierarchy = parseInt(targetHierarchy, 10);
        for(let i=0;i<targetHierarchy;i++){
            alert(i + '番目の階層の設定を開始します。');
            let targetClassName = window.prompt('スクレイピング対象のクラス名を設定してください。(未入力ならば未指定として扱う)', '');
            let targetIdName = window.prompt('スクレイピング対象のID名を設定してください。(未入力ならば未指定として扱う)', '');
            let targetAttribute = window.prompt('スクレイピング対象の対象属性を設定してください。(未入力ならばtextContentを取得)', '');

            let targetNameClassName = window.prompt('タイトルに指定するターゲットのクラス名を設定してください。(未入力ならば未指定として扱う)', '');
            let targetNameIdName = window.prompt('タイトルに指定するターゲットのID名を設定してください。(未入力ならば未指定として扱う)', '');
            let targetNameAttribute = window.prompt('タイトルに指定するターゲットの対象属性を設定してください。(未入力ならばtextContentを取得)', '');
            
            let targetSameDelete = window.prompt('同じ項目が設定されたら共通化するか。(未入力ならば共通化を実施。入力があれば未実施)', '');
            let isSameDelete = targetSameDelete == '';

            settings.push(new self_compose_scraping_setting(
                targetUrlInput,
                targetClassName,
                targetIdName,
                targetAttribute,
                targetNameClassName,
                targetNameIdName,
                targetNameAttribute,
                isSameDelete
            ));
        }
        let setting_str = '';
        setting_str += '対象URL:' + targetUrlInput + '\n';
        for(let i=0;i<settings.length;i++){
            let targetSetting = settings[i];
            setting_str += '第' + i + '階層\n';
            setting_str += '対象クラス:[' + targetSetting.target_class + ']\n';
            setting_str += '対象ID:[' + targetSetting.target_id + ']\n';
            setting_str += '対象取得属性:[' + targetSetting.result_attr + ']\n';

            setting_str += 'タイトルクラス:[' + targetSetting.target_name_class + ']\n';
            setting_str += 'タイトルID:[' + targetSetting.target_name_id + ']\n';
            setting_str += 'タイトル取得属性:[' + targetSetting.result_name_attr + ']\n';
        }
        let result = window.confirm(
            setting_str + 'スクレイピングを開始しますか？'
        );
        if(result){
            let scraping = new self_compose_scraping(settings,this,true);
            scraping.do_scraping();
        }
    }

    // スクレイピング終了を処理するクラス
    finish_scraping(result) {
        let jsonData = JSON.stringify(result);
        let blob = new Blob([jsonData], {type: 'text/plain'});
        let blobURL = URL.createObjectURL(blob);
        let a = document.createElement('a');
        a.download = 'scraping_result.json';
        a.href = blobURL;
        a.click();
    }
}

let start = new mainEngine();