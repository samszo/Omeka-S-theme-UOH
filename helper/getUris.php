<?php
namespace OmekaTheme\Helper;

use Laminas\View\Helper\AbstractHelper;

class getUris extends AbstractHelper
{
    /**
     * Récupère les uri d'une ressource
     * 
     * @param o:ressource   $r
     *
     * @return array
     */
    public function __invoke($r)
    {
        $arrUri = [];
        $values = $r->values();
        foreach ($values as $k => $oV) {
            foreach ($oV['values'] as $i => $v) {
                if($v->type()=='uri'){
                    $arrUri[] = [
                        'uri'=>$v->uri()
                        ,'label'=>$v->value() ? $v->value() : $oV['property']->label()
                    ];
                }
            }
        }

        return $arrUri;
    }
    function setUris($r,$p,$lbl){
        $v = $r->value($p);
        if($v && $v->type()=='uri'){
            return [
                'uri'=>$v->uri()
                ,'label'=>$v->label() ? $v->label() : $lbl
            ];
        }
    }
}