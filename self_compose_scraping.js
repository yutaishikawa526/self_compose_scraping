
// 自身を配列として含む、スクレイピングを行うクラス
class self_compose_scraping {
    constructor(scraping_settings, delegate) {
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
    }

    // スクレイピングを実行
    do_scraping() {
        // スクレイピング設定を解析
        let this_setting = this.scraping_settings[0];

        // スクレイピング
        //
        //
        //

        // スクレイピング結果とスクレイピング設定から、子要素作成
        // または、結果を返す
        if (this.scraping_settings.length == 1) {
            this.delegate.finish_scraping(this.scraping_result);
        } else {
            this.child_result_count = 0;
            this.child_result_max = this.scraping_result.length;
            for (let i = 0; i < this.scraping_result.length; i++) {
                let next_url = this.scraping_result[i].result;
                let child_setting = this.scraping_settings.concat();
                child_setting.shift();
                child_setting[0].target_url = next_url;
                let child_scr = new self_compose_scraping(child_setting,this);
                child_scr.do_scraping();
                this.child_scraping.push(child_scr);
            }
        }
    }

    // スクレイピング終了を処理するクラス
    finish_scraping(result) {
        for(let i=0;i<result.length;i++){
            this.scraping_result.push(result[i]);
        }
        this.child_result_count += 1;
        if (this.child_result_max == this.child_result_count) {
            this.delegate.finish_scraping(this.scraping_result);
        }
    }
}

// self_compose_scrapingのデリゲートクラス
class delegate_self_compose_scraping {
    // スクレイピング終了を処理するクラス
    finish_scraping(result) { }
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

class self_compose_scraping_result {
    constructor(result_name, result) {

        // スクレイピング結果
        this.result = result;

        // スクレイピング結果に付与する名前
        this.result_name = result_name;
    }
}